import {
  findBrandById,
  findBrandByName,
  saveBrand,
} from "../brand.repo.js";
import cloudinary from "../../../../config/cloudinary.js";
import { cloudinaryUpload } from "../../../../middlewares/upload.js";
import { brandValidation } from "../brand.validator.js";

export const editBrandService = async (body, file) => {
  const { brandId, brandName } = body;

  const { error } = brandValidation.validate(body);
  if (error) {
    return { status: 400, success: false, message: error.details[0].message };
  }

  const brand = await findBrandById(brandId);
  if (!brand) {
    return { status: 404, success: false, message: "Brand not found" };
  }

  // If name changed, ensure unique
  if (brand.brandName !== brandName) {
    const exists = await findBrandByName(brandName);
    if (exists) {
      return {
        status: 400,
        success: false,
        message: "Brand name already exists",
      };
    }
  }

  let newLogoUrl = brand.logo;

  // If new logo uploaded
  if (file) {
    const result = await cloudinaryUpload(file.buffer, "brands");
    newLogoUrl = result.secure_url;

    // Delete old logo
    if (brand.logo) {
      const publicId = brand.logo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/brands/${publicId}`);
    }
  }

  brand.brandName = brandName;
  brand.logo = newLogoUrl;

  await saveBrand(brand);

  return {
    status: 200,
    success: true,
    message: "Brand updated successfully",
    brand,
  };
};
