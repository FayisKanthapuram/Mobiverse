import productModel from "../models/product.model.js";
import mongoose from "mongoose";

// Product repository - data access layer for products
// Aggregate latest products with brand and variant details
export const getLatestProductsAgg = (limit = 5, userId = null) => {
  return productModel.aggregate([
    {
      $lookup: {
        from: "brands",
        foreignField: "_id",
        localField: "brandID",
        as: "brands",
      },
    },
    { $unwind: "$brands" },
    {
      $match: {
        "brands.isListed": true,
        isListed: true,
      },
    },
    {
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$productId", "$$productId"] },
                  { $eq: ["$isListed", true] },
                  { $gte: ["$stock", 1] },
                ],
              },
            },
          },
          { $sort: { salePrice: 1 } },
          { $limit: 1 },
        ],
        as: "variants",
      },
    },
    { $unwind: "$variants" },
    { $sort: { updatedAt: -1 } },
    { $limit: limit },

    // Populate product offer details
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "product"] },
                  { $in: ["$$productId", "$productID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "productOffer",
      },
    },
    //brand offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "brand"] },
                  { $eq: ["$$brandID", "$brandID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "brandOffer",
      },
    },
  ]);
};

// Aggregate featured products with brand and variant details
export const getFeaturedProductsAgg = (userId=null) => {
  return productModel.aggregate([
    {
      $lookup: {
        from: "brands",
        foreignField: "_id",
        localField: "brandID",
        as: "brands",
      },
    },
    { $unwind: "$brands" },
    {
      $match: {
        "brands.isListed": true,
        isListed: true,
        isFeatured: true,
      },
    },
    {
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$productId", "$$productId"] },
                  { $eq: ["$isListed", true] },
                  { $gte: ["$stock", 1] },
                ],
              },
            },
          },
          { $sort: { salePrice: 1 } },
          { $limit: 1 },
        ],
        as: "variants",
      },
    },
    { $unwind: "$variants" },
    //product offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "product"] },
                  { $in: ["$$productId", "$productID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "productOffer",
      },
    },
    //brand offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "brand"] },
                  { $eq: ["$$brandID", "$brandID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "brandOffer",
      },
    },
  ]);
};

export const getSingleProductAgg = (productId) => {
  return productModel.aggregate([
    { $match: { _id: productId, isListed: true } },
    {
      $lookup: {
        from: "brands",
        localField: "brandID",
        foreignField: "_id",
        as: "brands",
      },
    },
    { $unwind: "$brands" },
    { $match: { "brands.isListed": true } },
    {
      $lookup: {
        from: "variants",
        localField: "_id",
        foreignField: "productId",
        as: "variants",
      },
    },
    // Populate product offer details for the single product
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "product"] },
                  { $in: ["$$productId", "$productID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "productOffer",
      },
    },
    //brand offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$offerType", "brand"] },
                  { $eq: ["$$brandID", "$brandID"] },
                  { $lte: ["$startDate", "$$today"] },
                  { $gte: ["$endDate", "$$today"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "brandOffer",
      },
    },
  ]);
};

// Aggregate shop products based on a pipeline
export const getShopProductsAgg = (pipeline) => {
  return productModel.aggregate(pipeline);
};
// Count shop products based on an aggregation pipeline

export const countShopProductsAgg = (pipeline) => {
  return productModel.aggregate(pipeline);
};
// Find products by query with sorting, skipping, and limiting

export const findProducts = (query, sort = { name: 1 }, skip = 0, limit = 10) =>
// Count products by query
  productModel.find(query).sort(sort).skip(skip).limit(limit);

// Find product by ID
export const countProducts = (query) => productModel.countDocuments(query);
// Create a new product

export const findProductById = (productId) => productModel.findById(productId);
// Update product by ID

export const createProduct = (data) => productModel.create(data);
// Aggregate product by ID with variants

export const updateProductById = (productId, update) =>
  productModel.findByIdAndUpdate(productId, update, { new: true });

export const aggregateProductById = (productId) =>
  productModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(productId) } },
    {
      $lookup: {
        from: "variants",
        foreignField: "productId",
        localField: "_id",
// Save product changes
        as: "variants",
      },
    },
  ]);

export const saveProduct = (product) => {
  return product.save();
};

export const countProductsByBrandId=(brandID)=>{
  return productModel.countDocuments({brandID});
}