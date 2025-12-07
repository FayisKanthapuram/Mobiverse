// src/services/product.service.js
import {
  findProducts,
  countProducts,
  findProductById,
  createProduct,
  updateProductById,
  aggregateProductById,
} from "../modules/admin/product/repo/product.repo.js";
import {
  findVariantsByProduct,
  createVariant,
  updateVariantById,
} from "../modules/admin/product/repo/variant.repo.js";
import {
  findBrandById,
  findAllListedBrands,
} from "../modules/brand/brand.repo.js";
import { cloudinaryUpload } from "../middlewares/upload.js";
import {
  rollbackCloudinary,
  getPublicIdFromUrl,
  calcMinMaxStock,
} from "../modules/admin/product/product.helper.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Get filtered products for admin listing
 */
export const getFilteredProducts = async ({
  search = "",
  status = "All",
  brand = "",
  page = 1,
  limit = 5,
}) => {
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * limit;

  const query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (status === "listed") query.isListed = true;
  if (status === "unlisted") query.isListed = false;
  if (brand) query.brandID = brand;

  const [products, totalDocuments, brands] = await Promise.all([
    findProducts(query, { createdAt: -1 }, skip, limit).populate("brandID"),
    countProducts(query),
    findAllListedBrands(),
  ]);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    products,
    totalDocuments,
    totalPages,
    limit,
    brands,
  };
};

/**
 * Search products for select/search endpoints
 */
export const getProductsBySearch = async (q = "") => {
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  return findProducts(query, { name: 1 }, 0, 20);
};

export const addProductService = async (body, files) => {
  const uploadedPublicIds = [];

  try {
    // Validate name/brand at controller level (we assume productValidationSchema done earlier)
    const variants = JSON.parse(body.variants || "[]");
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Variants data required");
    }

    if (!files || files.length === 0) throw new Error("No images uploaded");

    // Group images by variant index based on fieldname pattern variantImages_{index}_{n}
    const imagesByVariant = {};
    for (const file of files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;
      const idx = match[1];
      const uploadResult = await cloudinaryUpload(file.buffer, "products");
      // keep public_id for rollback
      uploadedPublicIds.push(
        uploadResult.public_id || uploadResult.publicId || uploadResult.publicId
      );
      imagesByVariant[idx] = imagesByVariant[idx] || [];
      imagesByVariant[idx].push(uploadResult.secure_url);
    }

    // Ensure each variant has at least 3 images
    for (let i = 0; i < variants.length; i++) {
      if (!imagesByVariant[i] || imagesByVariant[i].length < 3) {
        await rollbackCloudinary(uploadedPublicIds);
        throw new Error(`Variant ${i + 1} must have at least 3 images`);
      }
    }

    // attach images
    const finalVariants = variants.map((v, idx) => ({
      ...v,
      images: imagesByVariant[idx] || [],
    }));

    // check product name uniqueness
    const existing = await findProducts({ name: body.productName }, {}, 0, 1);
    if (existing && existing.length) {
      await rollbackCloudinary(uploadedPublicIds);
      throw new Error("Product name already exists");
    }

    // validate brand
    const brand = await findBrandById(body.brand);
    if (!brand) {
      await rollbackCloudinary(uploadedPublicIds);
      throw new Error("Invalid brand ID");
    }

    // calc prices & stock
    const { minPrice, maxPrice, totalStock } = calcMinMaxStock(finalVariants);

    // create product
    const product = await createProduct({
      name: body.productName,
      image: finalVariants[0].images[0],
      brandID: brand._id,
      description: body.description || "",
      isFeatured: Boolean(body.isFeatured),
      isListed: body.isListed === "true" || body.isListed === true,
      minPrice,
      maxPrice,
      totalStock,
    });

    // create variants
    await Promise.all(
      finalVariants.map((v) =>
        createVariant({
          productId: product._id,
          regularPrice: Number(v.regularPrice || 0),
          salePrice: Number(v.salePrice),
          ram: v.ram,
          storage: v.storage,
          colour: (v.colour || "").toLowerCase(),
          stock: Number(v.stockQuantity || v.stock || 0),
          images: v.images,
          isListed: v.isListed === "true" || v.isListed === true,
        })
      )
    );

    return { success: true, product };
  } catch (err) {
    try {
      if (Array.isArray(uploadedPublicIds) && uploadedPublicIds.length) {
        await rollbackCloudinary(uploadedPublicIds);
      }
    } catch (e) {
      // ignore rollback errors
    }
    throw err;
  }
};

export const editProductService = async (productId, body, files = []) => {
  const uploadedPublicIds = [];
  try {
    const variants = JSON.parse(body.variants || "[]");
    const dbVariants = await findVariantsByProduct(productId);

    const newImagesMapping = {};
    for (const file of files || []) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;
      const idx = Number(match[1]);
      const uploadResult = await cloudinaryUpload(file.buffer, "products");
      uploadedPublicIds.push(uploadResult.public_id || uploadResult.publicId);
      newImagesMapping[idx] = newImagesMapping[idx] || [];
      newImagesMapping[idx].push(uploadResult.secure_url);
    }

    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].existingImages) variants[i].existingImages = [];
      if (newImagesMapping[i])
        variants[i].existingImages.push(...newImagesMapping[i]);
    }

    for (let i = 0; i < variants.length; i++) {
      const oldVariant = dbVariants[i];
      if (!oldVariant) continue;
      const oldImages = oldVariant.images || [];
      const newImages = variants[i].existingImages || [];
      const removed = oldImages.filter((img) => !newImages.includes(img));
      for (const url of removed) {
        const publicId = getPublicIdFromUrl(url);
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.warn("Failed to delete old image", publicId, e?.message);
        }
      }
    }

    // validate 3 images per variant
    for (let i = 0; i < variants.length; i++) {
      if (
        !variants[i].existingImages ||
        variants[i].existingImages.length < 3
      ) {
        await rollbackCloudinary(uploadedPublicIds);
        throw new Error(`Variant ${i + 1} must have at least 3 images.`);
      }
    }

    const mainImage =
      variants.find((v) => v.existingImages && v.existingImages.length > 0)
        ?.existingImages[0] || undefined;

    const { minPrice, maxPrice, totalStock } = calcMinMaxStock(variants);

    await updateProductById(productId, {
      name: body.productName,
      brandID: body.brand,
      description: body.description,
      isFeatured: Boolean(body.isFeatured),
      isListed: body.isListed === "true" || body.isListed === true,
      image: mainImage,
      minPrice,
      maxPrice,
      totalStock,
    });

    await Promise.all(
      variants.map(async (v) => {
        if (!v._id) {
          await createVariant({
            productId,
            images: v.existingImages,
            regularPrice: Number(v.regularPrice || 0),
            salePrice: Number(v.salePrice),
            ram: v.ram,
            storage: v.storage,
            colour: (v.colour || "").toLowerCase(),
            stock: Number(v.stockQuantity || v.stock || 0),
            isListed: v.isListed === "true" || v.isListed === true,
          });
        } else {
          await updateVariantById(v._id, {
            images: v.existingImages,
            regularPrice: Number(v.regularPrice || 0),
            salePrice: Number(v.salePrice),
            ram: v.ram,
            storage: v.storage,
            colour: (v.colour || "").toLowerCase(),
            stock: Number(v.stockQuantity || v.stock || 0),
            isListed: v.isListed === "true" || v.isListed === true,
          });
        }
      })
    );

    return { success: true };
  } catch (err) {
    try {
      if (Array.isArray(uploadedPublicIds) && uploadedPublicIds.length) {
        await rollbackCloudinary(uploadedPublicIds);
      }
    } catch (_) {}
    throw err;
  }
};

export const toggleProductService = async (productId) => {
  const product = await findProductById(productId);
  if (!product) throw new Error("Product not found");
  product.isListed = !product.isListed;
  await product.save();
  return { success: true };
};

export const getProductByIdService = async (productId) => {
  const arr = await aggregateProductById(productId);
  return arr[0] || null;
};
