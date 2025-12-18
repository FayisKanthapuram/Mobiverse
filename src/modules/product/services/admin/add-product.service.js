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

export const addProductService = async (body, files) => {
  const uploadedPublicIds = [];

  try {
    const variants = JSON.parse(body.variants || "[]");
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new AppError(ProductMessages.VARIANTS_DATA_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    if (!files || files.length === 0) {
      throw new AppError(ProductMessages.NO_IMAGES_UPLOADED, HttpStatus.BAD_REQUEST);
    }

    const imagesByVariant = {};

    for (const file of files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (!match) continue;

      const idx = match[1];
      const uploadResult = await cloudinaryUpload(file.buffer, "products");

      uploadedPublicIds.push(uploadResult.public_id);
      imagesByVariant[idx] = imagesByVariant[idx] || [];
      imagesByVariant[idx].push(uploadResult.secure_url);
    }

    for (let i = 0; i < variants.length; i++) {
      if (!imagesByVariant[i] || imagesByVariant[i].length < 3) {
        throw new AppError(
          ProductMessages.VARIANT_MIN_IMAGES.replace("{index}", String(i + 1)),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const finalVariants = variants.map((v, idx) => ({
      ...v,
      images: imagesByVariant[idx],
    }));

    const existing = await findProducts({ name: body.productName }, {}, 0, 1);
    if (existing.length) {
      throw new AppError(ProductMessages.PRODUCT_NAME_EXISTS, HttpStatus.BAD_REQUEST);
    }

    const brand = await findBrandById(body.brand);
    if (!brand) {
      throw new AppError(ProductMessages.INVALID_BRAND_ID, HttpStatus.BAD_REQUEST);
    }

    const product = await createProduct({
      name: body.productName,
      brandID: brand._id,
      description: body.description || "",
      isFeatured: Boolean(body.isFeatured),
      isListed: body.isListed === "true" || body.isListed === true,
    });

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

    return product;
  } catch (err) {
    await rollbackCloudinary(uploadedPublicIds);
    throw err;
  }
};
