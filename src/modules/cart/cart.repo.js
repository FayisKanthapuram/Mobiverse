import mongoose from "mongoose";
import cartModel from "./cart.model.js";

export const fetchCartItems = (userId) => {
  return cartModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variantId",
      },
    },
    { $unwind: "$variantId" },
    { $match: { "variantId.isListed": true } },

    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productId",
      },
    },
    { $unwind: "$productId" },
    { $match: { "productId.isListed": true } },

    {
      $lookup: {
        from: "brands",
        localField: "productId.brandID",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    { $match: { "brand.isListed": true } },
    // Product Offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$productId._id",
          today: new Date(),
          salePrice: "$variantId.salePrice",
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
          brandID: "$brand._id",
          today: new Date(),
          salePrice: "$variantId.salePrice",
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
  ]);
};

export const updateCartQuantity = (cartId, quantity) => {
  return cartModel.updateOne(
    { _id: cartId },
    { $set: { quantity } }
  );
};

export const deleteUserCart = (userId) => {
  return cartModel.deleteMany({ userId });
};

export const findCartItem = (userId, variantId) => {
  return cartModel.findOne({ userId, variantId });
};

export const createCartItem = (data) => {
  return cartModel.create(data);
};

export const saveCartItem = (cartItem) => {
  return cartItem.save();
};

export const findCartItemById = (id) => {
  return cartModel.findById(id).populate("variantId");
};

