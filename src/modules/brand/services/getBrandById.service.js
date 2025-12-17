import { findBrandById } from "../brand.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { BrandMessages } from "../../../shared/constants/messages/brandMessages.js";

export const getBrandByIdService = async (brandId) => {
  const brand = await findBrandById(brandId).lean();

  if (!brand) {
    throw new AppError(BrandMessages.BRAND_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return brand;
};
