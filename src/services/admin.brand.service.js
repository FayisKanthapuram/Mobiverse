import { cloudinaryUpload } from "../middlewares/upload.js";
import {
  findBrands,
  countBrands,
  findBrandByName,
  createBrand,
  findBrandById,
  saveBrand,
} from "../repositories/brand.repo.js";
import { brandValidation } from "../validators/brand.validator.js";

export const loadBrandsService = async (queryParams) => {
  const search = queryParams.search || "";
  const filter = queryParams.filter || "All";
  const currentPage = parseInt(queryParams.page) || 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const query = {};

  if (search) {
    query.brandName = { $regex: search, $options: "i" };
  }

  if (filter === "listed") query.isListed = true;
  if (filter === "unlisted") query.isListed = false;

  const totalDocuments = await countBrands(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  const brands = await findBrands(query, limit, skip);

  return {
    brands,
    pagination: {
      currentPage,
      totalDocuments,
      totalPages,
      limit,
    },
  };
};

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
      return { status: 400, success: false, message: "Brand name already exists" };
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

export const listBrandService = async (brandId) => {
  const brand = await findBrandById(brandId);

  if (!brand) {
    return { status: 400, success: false, message: "Brand not found" };
  }

  brand.isListed = !brand.isListed;
  await saveBrand(brand);

  return { status: 200, success: true };
};

export const getBrandByIdService = async (brandId) => {
  const brand = await findBrandById(brandId).lean();

  if (!brand) {
    return { status: 404, success: false, message: "Brand not found" };
  }

  return { status: 200, success: true, brand };
};