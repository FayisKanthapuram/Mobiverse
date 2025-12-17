import { findBrandById, saveBrand } from "../brand.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { BrandMessages } from "../../../shared/constants/messages/brandMessages.js";

export const listBrandService = async (brandId) => {
  const brand = await findBrandById(brandId);
  if (!brand) {
    throw new AppError(BrandMessages.BRAND_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  brand.isListed = !brand.isListed;
  await saveBrand(brand);

  return true;
};
