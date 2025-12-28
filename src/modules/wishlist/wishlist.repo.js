import mongoose from "mongoose";
import wishlistModel from "./wishlist.model.js";

export const fetchWishlist = async (userId) => {
  return wishlistModel
    .findOne({ userId })
    .select("items.variantId") // only what we need
    .lean();
};


export const fetchWishlistItems = (userId, limit, skip) => {
  return wishlistModel.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },

    // ---------- LOOKUP PRODUCTS ----------
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

    // ---------- LOOKUP VARIANTS ----------
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

    // ---------- LOOKUP BRANDS ----------
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

    // ---------- MERGE PRODUCT + VARIANT ----------
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

    // ---------- MERGE BRAND ----------
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

    // =====================================================
    // ✅ REMOVE UNLISTED / NULL ITEMS
    // =====================================================
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

    // =====================================================
    // ✅ PAGINATION INSIDE ITEMS (FINAL STAGE)
    // =====================================================
    {
      $addFields: {
        items:
          skip != null && limit != null
            ? { $slice: ["$items", skip, limit] }
            : "$items",
      },
    },

    // ---------- CLEANUP ----------
    {
      $project: {
        products: 0,
        variants: 0,
        brands: 0,
      },
    },
  ]);
};

export const getWishlistItemsCount = async (userId) => {
  const result = await wishlistModel.aggregate([
    // 1️⃣ Match user wishlist
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    // 2️⃣ Unwind wishlist items
    { $unwind: "$items" },

    // 3️⃣ Lookup variant
    {
      $lookup: {
        from: "variants",
        localField: "items.variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    { $unwind: "$variant" },

    // 4️⃣ Filter listed variant + stock
    {
      $match: {
        "variant.isListed": true,
      },
    },

    // 5️⃣ Lookup product
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    // 6️⃣ Filter listed product
    {
      $match: {
        "product.isListed": true,
      },
    },

    // 7️⃣ Lookup brand
    {
      $lookup: {
        from: "brands",
        localField: "product.brandID",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },

    // 8️⃣ Filter listed brand
    {
      $match: {
        "brand.isListed": true,
      },
    },

    // 9️⃣ Count valid wishlist items
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
      },
    },

    // 🔟 Clean output
    {
      $project: {
        _id: 0,
        totalItems: 1,
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

export const createWishlist = async (userId) => {
  return wishlistModel.create({ userId });
};


