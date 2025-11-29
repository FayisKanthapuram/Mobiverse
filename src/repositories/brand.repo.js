import brandModel from "../models/brandModel.js";

export const getHomeBrands = () => {
  return brandModel.find({ isListed: true }).limit(6);
};

export const getAllListedBrands = () => {
  return brandModel.find({ isListed: true });
};