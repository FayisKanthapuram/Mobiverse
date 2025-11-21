import mongoose from "mongoose";
import cartModel from "../models/cartModel.js";

// ------- Fetch All Cart Items with Lookups -------
export const getCartItems = async (userId) => {
  return await cartModel.aggregate([
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


// ------- Calculate Subtotal, Discounts, and Fix Quantity -------
export const calculateCartTotals = async (items) => {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  let deliveryCharge=0;

  for (let item of items) {
    // Auto-adjust invalid quantity
    if (item.quantity > item.variantId.stock && item.variantId.stock !== 0) {
      item.quantity = 1;
      item.adjusted = true;

      await cartModel.updateOne({ _id: item._id }, { $set: { quantity: 1 } });
    } else {
      item.adjusted = false;
    }

    // Totals
    subtotal += item.variantId.salePrice * item.quantity;

    if (item.variantId.regularPrice) {
      discount +=
        (item.variantId.regularPrice - item.variantId.salePrice) *
        item.quantity;
    }
  }

  // Optional: Add tax calculation rule here
  // tax = subtotal * 0.05

  return {
    subtotal,
    discount,
    tax,
    items,
    deliveryCharge
  };
};
