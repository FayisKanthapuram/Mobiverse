import mongoose from "mongoose";
import wishlistModel from "./wishlist.model.js";

// Wishlist repository - data access for wishlist collections

// Fetch wishlist document for a user
export const fetchWishlist = async (userId) => {
  return wishlistModel
    .findOne({ userId })
    .select("items.variantId") // select variant ids only
    .lean();
};


// Aggregate and fetch wishlist items with product/variant/brand data
export const fetchWishlistItems = (userId, limit, skip) => {
  return wishlistModel.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },

    // Lookup products
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

    // Lookup variants
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

    // Lookup brands
    {
      $lookup: {
        from: "brands",
        let: { brandIds: "$products.brandID" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$brandIds"] } } },
          { $match: { isListed: true } },
        ],
        as: "brands",
      },
    },

    // Merge product and variant into items
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

    // Merge brand into items
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
                  brandId: {
                    $first: {
                      $filter: {
                        input: "$brands",
                        as: "b",
                        cond: {
                          $eq: ["$$b._id", "$$i.productId.brandID"],
                        },
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

    // Remove unlisted or null items
    {
      $addFields: {
        items: {
          $filter: {
            input: "$items",
            as: "i",
            cond: {
              $and: [
                { $ne: ["$$i.productId", null] },
                { $ne: ["$$i.variantId", null] },
                { $ne: ["$$i.brandId", null] },
                { $eq: ["$$i.productId.isListed", true] },
                { $eq: ["$$i.variantId.isListed", true] },
                { $eq: ["$$i.brandId.isListed", true] },
              ],
            },
          },
        },
      },
    },

    // Paginate items inside wishlist (slice)
    {
      $addFields: {
        items:
          skip != null && limit != null
            ? { $slice: ["$items", skip, limit] }
            : "$items",
      },
    },

    // Cleanup temporary arrays from result
    {
      $project: {
        products: 0,
        variants: 0,
        brands: 0,
      },
    },
  ]);
};

// Count valid wishlist items for a user
export const getWishlistItemsCount = async (userId) => {
  const result = await wishlistModel.aggregate([
    // Match user wishlist
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    // Unwind wishlist items
    { $unwind: "$items" },

    // Lookup variant
    {
      $lookup: {
        from: "variants",
        localField: "items.variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    { $unwind: "$variant" },

    // Filter listed variant
    {
      $match: {
        "variant.isListed": true,
      },
    },

    // Lookup product
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    // Filter listed product
    {
      $match: {
        "product.isListed": true,
      },
    },

    // Lookup brand
    {
      $lookup: {
        from: "brands",
        localField: "product.brandID",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },

    // Filter listed brand
    {
      $match: {
        "brand.isListed": true,
      },
    },

    // Count valid wishlist items
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
      },
    },

    // Project output
    {
      $project: {
        _id: 0,
        totalItems: 1,
      },
    },
  ]);

  return result[0]?.totalItems || 0;
};


// Add an item to the user's wishlist
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

// Remove an item from the user's wishlist
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

// Check if an item exists in the wishlist
export const checkInWishlist = (userId, productId, variantId) => {
  return wishlistModel.findOne({
    userId,
    items: {
      $elemMatch: { variantId, productId },
    },
  });
};

// Delete user's wishlist document
export const deleteWishlist = (userId) => {
  return wishlistModel.deleteOne({ userId });
};

// Create a wishlist document for a user
export const createWishlist = async (userId) => {
  return wishlistModel.create({ userId });
};


