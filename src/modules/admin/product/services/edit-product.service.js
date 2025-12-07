import {
  findVariantsByProduct,
  createVariant,
  updateVariantById,
} from "../repo/variant.repo.js";
import {
  updateProductById,
} from "../repo/product.repo.js";
import { cloudinaryUpload } from "../../../../middlewares/upload.js";
import {
  rollbackCloudinary,
  getPublicIdFromUrl,
  calcMinMaxStock,
} from "../product.helper.js";
import cloudinary from "../../../../config/cloudinary.js";

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
