import { findBrandById, saveBrand } from "../brand.repo.js";

export const listBrandService = async (brandId) => {
  const brand = await findBrandById(brandId);

  if (!brand) {
    return { status: 400, success: false, message: "Brand not found" };
  }

  brand.isListed = !brand.isListed;
  await saveBrand(brand);

  return { status: 200, success: true };
};
