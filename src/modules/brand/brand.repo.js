import brandModel from "./brand.model.js";

// Brand repository - DB operations for brands

// Get brands for home page (limited)
export const getHomeBrands = () => {
  return brandModel.find({ isListed: true }).limit(6);
};

// Get all listed brands
export const getAllListedBrands = () => {
  return brandModel.find({ isListed: true });
};

// Find brand by id
export const findBrandById = (brandId) => {
  return brandModel.findById(brandId);
};

// Find brands with pagination
export const findBrands = (query, limit, skip) => {
  return brandModel
    .find(query)
    .sort({ brandName: 1 })
    .skip(skip)
    .limit(limit);
};

// Count brands matching query
export const countBrands = (query) => {
  return brandModel.countDocuments(query);
};

// Find brand by name
export const findBrandByName = (brandName) => {
  return brandModel.findOne({ brandName });
};

// Create a brand
export const createBrand = (data) => {
  return brandModel.create(data);
};

// Save brand instance
export const saveBrand = (brand) => {
  return brand.save();
};

// Toggle listing flag on a brand
export const toggleBrandListing = (brand) => {
  brand.isListed = !brand.isListed;
  return brand.save();
};

// Alias: find all listed brands
export const findAllListedBrands = () => brandModel.find({ isListed: true });