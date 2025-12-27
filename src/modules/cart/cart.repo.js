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
    //product offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$productId._id",
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
          brandID: "$brand._id",
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

export const fetchCart = async (userId) => {
  return cartModel.find({ userId }).select("variantId").lean();
};

export const getCartItemsCount = async (userId) => {
  const result = await cartModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: "$quantity" },
      },
    },
    {
      $project: {
        _id: 0,
        totalItems: 1,
      },
    },
  ]);
  return result[0]?.totalItems || 0;
};

