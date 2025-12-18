import productModel from "../models/product.model.js";
import mongoose from "mongoose";

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

    // Product Offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "productOffer",
      },
    },
    {
      $unwind: {
        path: "$productOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { productOffer: "$productOffer.offer" } },

    // Brand Offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "brandOffer",
      },
    },
    {
      $unwind: {
        path: "$brandOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { brandOffer: "$brandOffer.offer" } },

    // Final offer selection
    {
      $addFields: {
        offer: {
          $ceil: {
            $cond: {
              if: { $gte: ["$brandOffer", "$productOffer"] },
              then: "$brandOffer",
              else: "$productOffer",
            },
          },
        },
      },
    },

    //is in cart
    {
      $lookup: {
        from: "carts",
        let: {
          productId: "$_id",
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$productId", "$productId"] },
                  { $eq: ["$$userId", "$userId"] },
                ],
              },
            },
          },
          {
            $project: { _id: 1 },
          },
        ],
        as: "cart",
      },
    },
    {
      $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: { cart: "$cart._id" },
    },
  ]);
};

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
    // Product Offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "productOffer",
      },
    },
    {
      $unwind: {
        path: "$productOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { productOffer: "$productOffer.offer" } },

    // Brand Offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "brandOffer",
      },
    },
    {
      $unwind: {
        path: "$brandOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { brandOffer: "$brandOffer.offer" } },

    // Final offer selection
    {
      $addFields: {
        offer: {
          $ceil: {
            $cond: {
              if: { $gte: ["$brandOffer", "$productOffer"] },
              then: "$brandOffer",
              else: "$productOffer",
            },
          },
        },
      },
    },

    //is in cart
    {
      $lookup: {
        from: "carts",
        let: {
          productId: "$_id",
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$productId", "$productId"] },
                  { $eq: ["$$userId", "$userId"] },
                ],
              },
            },
          },
          {
            $project: { _id: 1 },
          },
        ],
        as: "cart",
      },
    },
    {
      $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: { cart: "$cart._id" },
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

export const getShopProductsAgg = (pipeline) => {
  return productModel.aggregate(pipeline);
};

export const countShopProductsAgg = (pipeline) => {
  return productModel.aggregate(pipeline);
};

export const findProducts = (query, sort = { name: 1 }, skip = 0, limit = 10) =>
  productModel.find(query).sort(sort).skip(skip).limit(limit);

export const countProducts = (query) => productModel.countDocuments(query);

export const findProductById = (productId) => productModel.findById(productId);

export const createProduct = (data) => productModel.create(data);

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