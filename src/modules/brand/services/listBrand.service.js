import { findBrandById, saveBrand } from "../brand.repo.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const listBrandService = async (brandId) => {
  const brand = await findBrandById(brandId);

  if (!brand) {
    return { status: HttpStatus.BAD_REQUEST, success: false, message: "Brand not found" };
  }

  brand.isListed = !brand.isListed;
  await saveBrand(brand);

  return { status: HttpStatus.OK, success: true };
};
