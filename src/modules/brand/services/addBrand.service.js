import { findBrandByName, createBrand } from "../brand.repo.js";
import { cloudinaryUpload } from "../../../middlewares/upload.js";
import { brandValidation } from "../brand.validator.js";

export const addBrandService = async (body, file) => {
  // Validate inputs
  const { error } = brandValidation.validate(body);
  if (error) {
    return { status: 400, success: false, message: error.details[0].message };
  }

  const { brandName } = body;

  // Check if name exists
  const existingBrand = await findBrandByName(brandName);
  if (existingBrand) {
    return {
      status: 400,
      success: false,
      message: "Brand name already exists",
    };
  }

  let cloudinaryLogo = null;

  // Upload Logo
  if (file) {
    const uploadResult = await cloudinaryUpload(file.buffer, "brands");
    cloudinaryLogo = uploadResult.secure_url;
  }

  const newBrand = await createBrand({
    brandName,
    logo: cloudinaryLogo,
  });

  return {
    status: 200,
    success: true,
    message: "Brand added successfully",
    brand: newBrand,
  };
};
