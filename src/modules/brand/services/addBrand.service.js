import { findBrandByName, createBrand } from "../brand.repo.js";
import { cloudinaryUpload } from "../../../shared/middlewares/upload.js";
import { brandValidation } from "../brand.validator.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const addBrandService = async (body, file) => {
  // Validate inputs
  const { error } = brandValidation.validate(body);
  if (error) {
    return { status: HttpStatus.BAD_REQUEST, success: false, message: error.details[0].message };
  }

  const { brandName } = body;

  // Check if name exists
  const existingBrand = await findBrandByName(brandName);
  if (existingBrand) {
    return {
      status: HttpStatus.BAD_REQUEST,
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
    status: HttpStatus.OK,
    success: true,
    message: "Brand added successfully",
    brand: newBrand,
  };
};
