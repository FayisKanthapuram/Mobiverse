import { findProducts, createProduct } from "../../repo/product.repo.js";
import { createVariant } from "../../repo/variant.repo.js";
import { findBrandById } from "../../../brand/brand.repo.js";
import { cloudinaryUpload } from "../../../../shared/middlewares/upload.js";
import {
  rollbackCloudinary,
} from "../../helpers/admin.product.helper.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { ProductMessages } from "../../../../shared/constants/messages/productMessages.js";

// Add product service - handle product creation
// Create new product with variants and images
export const addProductService = async (body, files = []) => {
  const uploadedPublicIds = [];

  try {
    /* -------------------- PARSE VARIANTS SAFELY -------------------- */
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

    if (!files || files.length === 0) {
      throw new AppError(
        ProductMessages.NO_IMAGES_UPLOADED,
        HttpStatus.BAD_REQUEST
      );
    }

    /* -------------------- GROUP IMAGES BY VARIANT -------------------- */
    const imagesByVariant = {};

    for (const file of files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;

      const index = Number(match[1]);
      const upload = await cloudinaryUpload(file.buffer, "products");

      uploadedPublicIds.push(upload.public_id);
      imagesByVariant[index] ||= [];
      imagesByVariant[index].push(upload.secure_url);
    }

    /* -------------------- VALIDATE VARIANTS -------------------- */
    variants.forEach((variant, index) => {
      const images = imagesByVariant[index];

      if (!images || images.length < 3) {
        throw new AppError(
          ProductMessages.VARIANT_MIN_IMAGES.replace(
            "{index}",
            String(index + 1)
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (Number(variant.salePrice) > Number(variant.regularPrice)) {
        throw new AppError(
          `Variant ${index + 1}: Sale price cannot exceed regular price`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (Number(variant.stockQuantity || variant.stock) < 0) {
        throw new AppError(
          `Variant ${index + 1}: Stock cannot be negative`,
          HttpStatus.BAD_REQUEST
        );
      }
    });

    /* -------------------- CHECK PRODUCT NAME -------------------- */
    const existing = await findProducts({ name: body.productName }, {}, 0, 1);

    if (existing.length) {
      throw new AppError(
        ProductMessages.PRODUCT_NAME_EXISTS,
        HttpStatus.BAD_REQUEST
      );
    }

    /* -------------------- VALIDATE BRAND -------------------- */
    const brand = await findBrandById(body.brand);
    if (!brand) {
      throw new AppError(
        ProductMessages.INVALID_BRAND_ID,
        HttpStatus.BAD_REQUEST
      );
    }

    /* -------------------- CREATE PRODUCT -------------------- */
    const product = await createProduct({
      name: body.productName,
      brandID: brand._id,
      description: body.description || "",
      isFeatured: body.isFeatured === "true" || body.isFeatured === true,
      isListed: body.isListed === "true" || body.isListed === true,
    });

    /* -------------------- CREATE VARIANTS -------------------- */
    await Promise.all(
      variants.map((v, index) =>
        createVariant({
          productId: product._id,
          images: imagesByVariant[index],
          regularPrice: Number(v.regularPrice || 0),
          salePrice: Number(v.salePrice),
          ram: v.ram,
          storage: v.storage,
          colour: (v.colour || "").toLowerCase(),
          stock: Number(v.stockQuantity || v.stock || 0),
          isListed: v.isListed === "true" || v.isListed === true,
        })
      )
    );

    return product;
  } catch (error) {
    await rollbackCloudinary(uploadedPublicIds);
    throw error;
  }
};
