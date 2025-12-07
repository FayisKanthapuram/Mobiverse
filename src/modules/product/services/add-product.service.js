import {
  findProducts,
  createProduct,
} from "../product.repo.js";
import {
  createVariant,
} from "../variant.repo.js";
import {
  findBrandById,
} from "../../brand/brand.repo.js";
import { cloudinaryUpload } from "../../../middlewares/upload.js";
import {
  rollbackCloudinary,
  calcMinMaxStock,
} from "../../../helpers/product.helpers.js";

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
