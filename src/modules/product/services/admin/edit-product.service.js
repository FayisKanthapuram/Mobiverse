import {
  findVariantsByProduct,
  createVariant,
  updateVariantById,
  deleteVariantById,
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

// Edit product service - handle product updates
// Update product with new variants and images
export const editProductService = async (productId, body, files = []) => {
  const uploadedPublicIds = [];

  try {
    /* -------------------- PARSE VARIANTS -------------------- */
    let variants;
    try {
      variants = JSON.parse(body.variants || "[]");
    } catch {
      throw new AppError("Invalid variants format", HttpStatus.BAD_REQUEST);
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new AppError(
        ProductMessages.VARIANTS_DATA_REQUIRED,
        HttpStatus.BAD_REQUEST
      );
    }

    /* -------------------- FETCH DB VARIANTS -------------------- */
    const dbVariants = await findVariantsByProduct(productId);
    if (!dbVariants.length) {
      throw new AppError(
        ProductMessages.PRODUCT_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    const dbVariantMap = new Map(dbVariants.map((v) => [String(v._id), v]));

    /* -------------------- FIND REMOVED VARIANTS -------------------- */
    const incomingVariantIds = new Set(
      variants.filter((v) => v._id).map((v) => String(v._id))
    );

    const removedVariants = dbVariants.filter(
      (v) => !incomingVariantIds.has(String(v._id))
    );

    /* -------------------- DELETE REMOVED VARIANTS -------------------- */
    await Promise.all(
      removedVariants.map(async (variant) => {
        await Promise.allSettled(
          (variant.images || []).map((url) =>
            cloudinary.uploader.destroy(getPublicIdFromUrl(url))
          )
        );
        await deleteVariantById(variant._id);
      })
    );

    /* -------------------- UPLOAD NEW IMAGES -------------------- */
    const newImagesMapping = {};

    for (const file of files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;

      const index = Number(match[1]);
      const upload = await cloudinaryUpload(file.buffer, "products");

      uploadedPublicIds.push(upload.public_id);
      newImagesMapping[index] ||= [];
      newImagesMapping[index].push(upload.secure_url);
    }

    /* -------------------- MERGE IMAGES -------------------- */
    variants.forEach((variant, index) => {
      variant.existingImages ||= [];
      if (newImagesMapping[index]) {
        variant.existingImages.push(...newImagesMapping[index]);
      }
    });

    /* -------------------- REMOVE DELETED IMAGES -------------------- */
    await Promise.all(
      variants.map(async (variant) => {
        if (!variant._id) return;

        const oldVariant = dbVariantMap.get(String(variant._id));
        if (!oldVariant) return;

        const removedImages = (oldVariant.images || []).filter(
          (img) => !variant.existingImages.includes(img)
        );

        await Promise.allSettled(
          removedImages.map((url) =>
            cloudinary.uploader.destroy(getPublicIdFromUrl(url))
          )
        );
      })
    );

    /* -------------------- VALIDATE VARIANTS -------------------- */
    variants.forEach((variant, index) => {
      if (!variant.existingImages || variant.existingImages.length < 3) {
        throw new AppError(
          ProductMessages.VARIANT_MIN_IMAGES.replace(
            "{index}",
            String(index + 1)
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    });

    /* -------------------- UPDATE PRODUCT -------------------- */
    await updateProductById(productId, {
      name: body.productName,
      brandID: body.brand,
      description: body.description,
      isFeatured: body.isFeatured === "true" || body.isFeatured === true,
      isListed: body.isListed === "true" || body.isListed === true,
    });

    /* -------------------- CREATE / UPDATE VARIANTS -------------------- */
    await Promise.all(
      variants.map(async (v) => {
        const payload = {
          images: v.existingImages,
          regularPrice: Number(v.regularPrice || 0),
          salePrice: Number(v.salePrice),
          ram: v.ram,
          storage: v.storage,
          colour: (v.colour || "").toLowerCase(),
          stock: Number(v.stockQuantity || v.stock || 0),
          isListed: v.isListed === "true" || v.isListed === true,
        };

        if (!v._id) {
          await createVariant({ productId, ...payload });
        } else {
          await updateVariantById(v._id, payload);
        }
      })
    );

    return true;
  } catch (error) {
    await rollbackCloudinary(uploadedPublicIds);
    throw error;
  }
};
