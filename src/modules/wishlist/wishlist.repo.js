import mongoose from "mongoose";
import wishlistModel from "./wishlist.model.js";

export const fetchWishlistItems = (userId, limit, skip) => {
  return wishlistModel.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $project: {
        items: { $slice: ["$items", skip, limit] },
      },
    },
    {
      $lookup: {
        from: "products",
        let: { productIds: "$items.productId" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$productIds"] } } },
          { $match: { isListed: true } },
        ],
        as: "products",
      },
    },
    {
      $lookup: {
        from: "variants",
        let: { variantIds: "$items.variantId" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$variantIds"] } } },
          { $match: { isListed: true } },
        ],
        as: "variants",
      },
    },
    {
      $lookup: {
        from: "brands",
        let: { brandIds: "$products.brandID" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$brandIds"] } } },
          { $match: { isListed: true } }
        ],
        as: "brands"
      }
    },
    {
      $addFields: {
        items: {
          $map: {
            input: "$items",
            as: "i",
            in: {
              $mergeObjects: [
                "$$i",
                {
                  productId: {
                    $first: {
                      $filter: {
                        input: "$products",
                        as: "p",
                        cond: { $eq: ["$$p._id", "$$i.productId"] },
                      },
                    },
                  },
                  variantId: {
                    $first: {
                      $filter: {
                        input: "$variants",
                        as: "v",
                        cond: { $eq: ["$$v._id", "$$i.variantId"] },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $addFields:{
        items:{
          $map:{
            input:'$items',
            as:'i',
            in:{
              $mergeObjects:[
                "$$i",
                {
                  brandId:{
                    $first:{
                      $filter:{
                        input:'$brands',
                        as:'brand',
                        cond:{$eq:['$$brand._id','$$i.productId.brandID']}
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      },
    },
    { $project: { products: 0, variants: 0 ,brands:0} },
  ]);
};

export const getWishlistItemsCount = async (userId) => {
  const result = await wishlistModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        totalItems: { $size: "$items" },
        _id: 0,
      },
    },
  ]);
  return result[0]?.totalItems || 0;
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

export const checkInWishlist = (userId, productId, variantId) => {
  return wishlistModel.findOne({
    userId,
    items: {
      $elemMatch: { variantId, productId },
    },
  });
};

export const deleteWishlist = (userId) => {
  return wishlistModel.deleteOne({ userId });
};
