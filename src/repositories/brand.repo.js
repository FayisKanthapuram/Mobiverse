import brandModel from "../models/brandModel.js";

export const getHomeBrands = () => {
  return brandModel.find({ isListed: true }).limit(6);
};

export const getAllListedBrands = () => {
  return brandModel.find({ isListed: true });
};

export const findBrandById = (brandId) => {
  return brandModel.findById(brandId);
};

export const findBrands = (query, limit, skip) => {
  return brandModel
    .find(query)
    .sort({ brandName: 1 })
    .skip(skip)
    .limit(limit);
};

export const countBrands = (query) => {
  return brandModel.countDocuments(query);
};

export const findBrandByName = (brandName) => {
  return brandModel.findOne({ brandName });
};

export const createBrand = (data) => {
  return brandModel.create(data);
};

export const saveBrand = (brand) => {
  return brand.save();
};

export const toggleBrandListing = (brand) => {
  brand.isListed = !brand.isListed;
  return brand.save();
};

export const findAllListedBrands = () => brandModel.find({ isListed: true });