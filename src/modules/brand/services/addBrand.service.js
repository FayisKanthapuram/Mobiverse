import { findBrandByName, createBrand } from "../brand.repo.js";
import { cloudinaryUpload } from "../../../shared/middlewares/upload.js";
import { brandValidation } from "../brand.validator.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { BrandMessages } from "../../../shared/constants/messages/brandMessages.js";

// Add brand service - validate and create brand with optional logo
export const addBrandService = async (body, file) => {
  const { error } = brandValidation.validate(body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const { brandName } = body;

  const existingBrand = await findBrandByName(brandName);
  if (existingBrand) {
    throw new AppError(BrandMessages.BRAND_NAME_EXISTS, HttpStatus.BAD_REQUEST);
  }

  let logo = null;

  if (file) {
    const uploadResult = await cloudinaryUpload(file.buffer, "brands");
    logo = uploadResult.secure_url;
  }

  const brand = await createBrand({ brandName, logo });

  return brand;
};
