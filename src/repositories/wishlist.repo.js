import mongoose from "mongoose";
import wishlistModel from "../models/wishlistModel.js";

export const fetchWishlistItems = (userId, limit, skip) => {
  return wishlistModel
    .find({ userId }, { items: { $slice: [skip, limit] } })
    .populate("items.productId")
    .populate("items.variantId");
};

export const getWishlistItemsCount = async (userId) => {
  const result = await wishlistModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        totalItems: { $size: "$items" },
        _id:0,
      },
    },
  ]);
  return result[0]?.totalItems||0;
};

export const createWishlistItem = (userId, productId, variantId) => {
  return wishlistModel.findOneAndUpdate(
    { userId },
    {
      $addToSet: {
        items: { productId, variantId },
      },
    },
    { upsert: true, new: true }
  );
};

export const removeWishlistItem = (userId, productId, variantId) => {
  return wishlistModel.findOneAndUpdate(
    { userId }, // find user wishlist
    {
      $pull: {
        items: { productId, variantId }, // remove matching item
      },
    },
    { new: true }
  );
};


export const checkInWishlist=(userId, productId, variantId)=>{
  return wishlistModel.findOne({
    userId,
    items:{
      $elemMatch:{variantId,productId}
    }
  })
}

export const deleteWishlist=(userId)=>{
  return wishlistModel.deleteOne({userId})
}