import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import brandModel from "../models/brandModel.js";

export const getFilteredProducts = async ({ search, status, brand, page }) => {
  const limit = 5;
  const skip = (page - 1) * limit;

  let query = {};

  // Search filter
  if (search) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  // Status filter
  if (status === "listed") query.isListed = true;
  else if (status === "unlisted") query.isListed = false;

  // Brand filter
  if (brand && mongoose.Types.ObjectId.isValid(brand)) {
    query.brandID = new mongoose.Types.ObjectId(brand);
  }

  // Count
  const totalDocuments = await productModel.countDocuments(query);

  // Fetch products
  const products = await productModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("brandID");

  // Fetch listed brands
  const brands = await brandModel.find({ isListed: true }, { brandName: 1 }).lean();

  return {
    products,
    brands,
    totalDocuments,
    limit,
    totalPages: Math.ceil(totalDocuments / limit),
  };
};

export const getProductsBySearch=async (search)=>{
  const query={
    isListed:true,
  }
  if (search) {
    query.name = { $regex: search.trim(), $options: "i" };
  }
  const products=await productModel.find(query).populate('brandID');
  return products;
}