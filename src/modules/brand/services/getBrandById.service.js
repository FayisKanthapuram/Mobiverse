import { findBrandById } from "../brand.repo.js";

export const getBrandByIdService = async (brandId) => {
  const brand = await findBrandById(brandId).lean();

  if (!brand) {
    return { status: 404, success: false, message: "Brand not found" };
  }

  return { status: 200, success: true, brand };
};
