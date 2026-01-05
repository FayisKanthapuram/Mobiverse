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
    // Brand offer
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
    // Reviews lookup
    {
      $lookup: {
        from: "reviews",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$productId", "$$productId"] },
            },
          },
          {
            $group: {
              _id: "$productId",
              avgRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ],
        as: "ratingData",
      },
    },
    {
      $addFields: {
        avgRating: {
          $round: [
            { $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0] },
            1,
          ],
        },
      },
    },
    {
      $project: {
        ratingData: 0,
      },
    },
  ]);
};

// Aggregate featured products with brand and variant details
export const getFeaturedProductsAgg = (userId = null) => {
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
    // Product offer
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
    // Brand offer
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
    // Reviews lookup
    {
      $lookup: {
        from: "reviews",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$productId", "$$productId"] },
            },
          },
          {
            $group: {
              _id: "$productId",
              avgRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ],
        as: "ratingData",
      },
    },
    {
      $addFields: {
        avgRating: {
          $round: [
            { $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0] },
            1,
          ],
        },
      },
    },
    {
      $project: {
        ratingData: 0,
      },
    },
  ]);
};

// Get single product aggregation with variants and offers
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
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$productId", "$$productId"] },
                  { $eq: ["$isListed", true] },
                ],
              },
            },
          },
        ],
        as: "variants",
      },
    },
    {
      $match: {
        "variants.0": { $exists: true },
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
  productModel.find(query).sort(sort).skip(skip).limit(limit);

// Count products by query
export const countProducts = (query) => productModel.countDocuments(query);

// Find product by ID
export const findProductById = (productId) => productModel.findById(productId);

// Create a new product
export const createProduct = (data) => productModel.create(data);

// Update product by ID
export const updateProductById = (productId, update) =>
  productModel.findByIdAndUpdate(productId, update, { new: true });

// Aggregate product by ID with variants
export const aggregateProductById = (productId) =>
  productModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(productId) } },
    {
      $lookup: {
        from: "variants",
        foreignField: "productId",
        localField: "_id",
        as: "variants",
      },
    },
  ]);

// Save product document
export const saveProduct = (product) => {
  return product.save();
};

// Count products for a brand
export const countProductsByBrandId = (brandID) => {
  return productModel.countDocuments({ brandID });
};
