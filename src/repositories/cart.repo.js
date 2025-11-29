import mongoose from "mongoose";
import cartModel from "../models/cartModel.js";

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
