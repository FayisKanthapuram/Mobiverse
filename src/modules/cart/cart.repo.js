import mongoose from "mongoose";
import cartModel from "./cart.model.js";

// Cart repository - DB operations for cart items

export const findUserCart = (userId) => {
  return cartModel.findOne({ userId });
};

export const addItemToCart = async (userId, item) => {
  return cartModel.updateOne(
    { userId },
    {
      $push: { items: item },
    },
    { upsert: true }
  );
};

export const findCartItem = async (userId, variantId) => {
  const result = await cartModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.variantId": new mongoose.Types.ObjectId(variantId),
      },
    },
    {
      $lookup: {
        from: "variants",
        localField: "items.variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    { $unwind: "$variant" },
    {
      $project: {
        _id: 0,
        productId: "$items.productId",
        variantId: "$variant",
        quantity: "$items.quantity",
      },
    },
  ]);

  return result[0] || null;
};

export const updateCartItemQuantity = (userId, variantId, quantity) => {
  return cartModel.updateOne(
    {
      userId,
      "items.variantId": variantId,
    },
    {
      $set: { "items.$.quantity": quantity },
    }
  );
};

export const removeCartItem = (userId, variantId) => {
  return cartModel.updateOne(
    { userId },
    {
      $pull: {
        items: { variantId },
      },
    }
  );
};

export const clearCart = (userId) => {
  return cartModel.deleteOne({ userId });
};


// Fetch detailed cart items for a user
export const fetchCartItems = (userId) => {
  return cartModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },

    { $unwind: "$items" },

    {
      $lookup: {
        from: "variants",
        localField: "items.variantId",
        foreignField: "_id",
        as: "variantId",
      },
    },
    { $unwind: "$variantId" },
    { $match: { "variantId.isListed": true } },

    {
      $lookup: {
        from: "products",
        localField: "items.productId",
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

    {
      $project: {
        _id: 0,
        itemId: "$items.variantId",
        quantity: "$items.quantity",
        productId: 1,
        variantId: 1,
        brand: 1,
        productOffer: 1,
        brandOffer:1,
      },
    },
  ]);
};


// Get total items count in cart (aggregated, considering listings)
export const getCartItemsCount = async (userId) => {
  const cart = await cartModel.findOne({ userId }).lean();
  if (!cart) return 0;

  return cart.items.length;
};