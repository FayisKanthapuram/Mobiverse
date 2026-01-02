import { findBrandById, findBrandByName, saveBrand } from "../brand.repo.js";
import cloudinary from "../../../config/cloudinary.js";
import { cloudinaryUpload } from "../../../shared/middlewares/upload.js";
import { brandValidation } from "../brand.validator.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { BrandMessages } from "../../../shared/constants/messages/brandMessages.js";

// Edit brand service - update brand and replace logo if provided
export const editBrandService = async (body, file) => {
  const { brandId, brandName } = body;

  const { error } = brandValidation.validate(body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const brand = await findBrandById(brandId);
  if (!brand) {
    throw new AppError(BrandMessages.BRAND_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (brand.brandName !== brandName) {
    const exists = await findBrandByName(brandName);
    if (exists) {
      throw new AppError(BrandMessages.BRAND_NAME_EXISTS, HttpStatus.BAD_REQUEST);
    }
  }

  let logo = brand.logo;

  if (file) {
    const uploadResult = await cloudinaryUpload(file.buffer, "brands");
    logo = uploadResult.secure_url;

    if (brand.logo) {
      const publicId = brand.logo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/brands/${publicId}`);
    }
  }

  brand.brandName = brandName;
  brand.logo = logo;

  await saveBrand(brand);
  return brand;
};
