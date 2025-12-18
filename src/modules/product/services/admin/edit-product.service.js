import {
  findVariantsByProduct,
  createVariant,
  updateVariantById,
} from "../../repo/variant.repo.js";
import { updateProductById } from "../../repo/product.repo.js";
import { cloudinaryUpload } from "../../../../shared/middlewares/upload.js";
import {
  rollbackCloudinary,
  getPublicIdFromUrl,
} from "../../helpers/admin.product.helper.js";
import cloudinary from "../../../../config/cloudinary.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { ProductMessages } from "../../../../shared/constants/messages/productMessages.js";

export const editProductService = async (productId, body, files = []) => {
  const uploadedPublicIds = [];

  try {
    const variants = JSON.parse(body.variants || "[]");
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new AppError(ProductMessages.VARIANTS_DATA_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const dbVariants = await findVariantsByProduct(productId);
    if (!dbVariants.length) {
      throw new AppError(ProductMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const newImagesMapping = {};

    for (const file of files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;

      const idx = Number(match[1]);
      const uploadResult = await cloudinaryUpload(file.buffer, "products");

      uploadedPublicIds.push(uploadResult.public_id);
      newImagesMapping[idx] = newImagesMapping[idx] || [];
      newImagesMapping[idx].push(uploadResult.secure_url);
    }

    // merge new images with existing
    for (let i = 0; i < variants.length; i++) {
      variants[i].existingImages ||= [];
      if (newImagesMapping[i]) {
        variants[i].existingImages.push(...newImagesMapping[i]);
      }
    }

    // remove deleted images from Cloudinary
    for (let i = 0; i < variants.length; i++) {
      const oldVariant = dbVariants[i];
      if (!oldVariant) continue;

      const removed = (oldVariant.images || []).filter(
        (img) => !variants[i].existingImages.includes(img)
      );

      for (const url of removed) {
        try {
          await cloudinary.uploader.destroy(getPublicIdFromUrl(url));
        } catch (e) {
          console.warn("Cloudinary delete failed:", url);
        }
      }
    }

    // validate minimum images
    for (let i = 0; i < variants.length; i++) {
      if (
        !variants[i].existingImages ||
        variants[i].existingImages.length < 3
      ) {
        throw new AppError(
          ProductMessages.VARIANT_MIN_IMAGES.replace("{index}", String(i + 1)),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await updateProductById(productId, {
      name: body.productName,
      brandID: body.brand,
      description: body.description,
      isFeatured: Boolean(body.isFeatured),
      isListed: body.isListed === "true" || body.isListed === true,
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

    return true;
  } catch (err) {
    await rollbackCloudinary(uploadedPublicIds);
    throw err;
  }
};
