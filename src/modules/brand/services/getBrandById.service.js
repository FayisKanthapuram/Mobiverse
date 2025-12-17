import { findBrandById } from "../brand.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const getBrandByIdService = async (brandId) => {
  const brand = await findBrandById(brandId).lean();

  if (!brand) {
    throw new AppError("Brand not found", HttpStatus.NOT_FOUND);
  }

  return brand;
};
