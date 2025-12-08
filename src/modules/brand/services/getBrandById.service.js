import { findBrandById } from "../brand.repo.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const getBrandByIdService = async (brandId) => {
  const brand = await findBrandById(brandId).lean();

  if (!brand) {
    return { status: HttpStatus.NOT_FOUND, success: false, message: "Brand not found" };
  }

  return { status: HttpStatus.OK, success: true, brand };
};
