import {
  getShopProductsAgg,
  countShopProductsAgg,
} from "../../repo/product.repo.js";
import { getAllListedBrands } from "../../../brand/brand.repo.js";
import { markWishlistStatus } from "../../../wishlist/wishlist.helper.js";
import { fetchWishlist } from "../../../wishlist/wishlist.repo.js";
import { findUserCart } from "../../../cart/cart.repo.js";
import { markCartStatus } from "../../../cart/helpers/cart.helper.js";

// Shop service - handle product browsing for users
// Load shop products with filters and sorting
export const loadShopService = async (query, userId = null) => {
  // -----------------------------
  // Normalize Query Params
  // -----------------------------
  const search = query.search?.trim() || "";
  const brand = query.brand || "all";
  const sort = query.sort || "";
  const minPrice = query.min ? Number(query.min) : null;
  const maxPrice = query.max ? Number(query.max) : null;
  const currentPage = parseInt(query.page, 10) || 1;

  const limit = 8;
  const skip = (currentPage - 1) * limit;

  // -----------------------------
  // Product + Brand Match
  // -----------------------------
  const matchStage = {
    isListed: true,
    "brands.isListed": true,
  };

  if (brand !== "all") {
    matchStage["brands.brandName"] = brand;
  }

  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }

  // -----------------------------
  // Variant Price Filter
  // -----------------------------
  const variantPriceExpr = [];

  if (minPrice !== null) {
    variantPriceExpr.push({ $gte: ["$salePrice", minPrice] });
  }

  if (maxPrice !== null) {
    variantPriceExpr.push({ $lte: ["$salePrice", maxPrice] });
  }

  // -----------------------------
  // SORT (FINAL PRICE BASED)
  // -----------------------------
  const sortStage = {};
  if (sort === "price-asc") sortStage.finalPrice = 1;
  else if (sort === "price-desc") sortStage.finalPrice = -1;
  else if (sort === "a-z") sortStage.name = 1;
  else if (sort === "z-a") sortStage.name = -1;
  else sortStage.updatedAt = -1;

  // -----------------------------
  // BASE PIPELINE
  // -----------------------------
  const basePipeline = [
    // Brand lookup
    {
      $lookup: {
        from: "brands",
        localField: "brandID",
        foreignField: "_id",
        as: "brands",
      },
    },
    { $unwind: "$brands" },
    { $match: matchStage },

    // Variant lookup (cheapest valid variant)
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
                  ...(variantPriceExpr.length ? variantPriceExpr : []),
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

    // Product offer
    {
      $lookup: {
        from: "offers",
        let: { productId: "$_id", today: new Date() },
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

    // Brand offer
    {
      $lookup: {
        from: "offers",
        let: { brandID: "$brandID", today: new Date() },
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

    // -----------------------------
    // PRODUCT OFFER VALUE
    // -----------------------------
    {
      $addFields: {
        productOfferValue: {
          $max: {
            $map: {
              input: "$productOffer",
              as: "offer",
              in: {
                $cond: [
                  { $eq: ["$$offer.discountType", "percentage"] },
                  {
                    $multiply: [
                      "$variants.salePrice",
                      { $divide: ["$$offer.discountValue", 100] },
                    ],
                  },
                  {
                    $cond: [
                      {
                        $lt: [
                          "$$offer.discountValue",
                          { $multiply: ["$variants.salePrice", 0.9] },
                        ],
                      },
                      "$$offer.discountValue",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },

    // -----------------------------
    // BRAND OFFER VALUE
    // -----------------------------
    {
      $addFields: {
        brandOfferValue: {
          $max: {
            $map: {
              input: "$brandOffer",
              as: "offer",
              in: {
                $cond: [
                  { $eq: ["$$offer.discountType", "percentage"] },
                  {
                    $multiply: [
                      "$variants.salePrice",
                      { $divide: ["$$offer.discountValue", 100] },
                    ],
                  },
                  {
                    $cond: [
                      {
                        $lt: [
                          "$$offer.discountValue",
                          { $multiply: ["$variants.salePrice", 0.9] },
                        ],
                      },
                      "$$offer.discountValue",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },

    // -----------------------------
    // FINAL OFFER + FINAL PRICE
    // -----------------------------
    {
      $addFields: {
        offer: {
          $ceil: {
            $max: [
              { $ifNull: ["$productOfferValue", 0] },
              { $ifNull: ["$brandOfferValue", 0] },
            ],
          },
        },
      },
    },
    {
      $addFields: {
        finalPrice: {
          $subtract: ["$variants.salePrice", "$offer"],
        },
      },
    },
  ];

  // -----------------------------
  // COUNT PIPELINE
  // -----------------------------
  const countPipeline = [...basePipeline, { $count: "totalDocuments" }];
  const countResult = await countShopProductsAgg(countPipeline);
  const totalDocuments = countResult[0]?.totalDocuments || 0;
  const totalPages = Math.ceil(totalDocuments / limit);

  // -----------------------------
  // PRODUCT PIPELINE
  // -----------------------------
  const productPipeline = [...basePipeline];

  if (Object.keys(sortStage).length) {
    productPipeline.push({ $sort: sortStage });
  }

  productPipeline.push({ $skip: skip }, { $limit: limit });

  const products = await getShopProductsAgg(productPipeline);

  // -----------------------------
  // Wishlist & Cart Status
  // -----------------------------
  const wishlist = userId ? await fetchWishlist(userId) : null;
  const cart = userId ? await findUserCart(userId) : null;

  let finalProducts = markWishlistStatus(products, wishlist);
  finalProducts = markCartStatus(finalProducts, cart);

  const brands = await getAllListedBrands();

  // -----------------------------
  // RETURN
  // -----------------------------
  return {
    products: finalProducts,
    brands,
    pagination: {
      currentPage,
      totalPages,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  };
};
