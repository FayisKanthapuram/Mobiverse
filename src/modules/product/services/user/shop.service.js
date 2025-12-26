import {
  getShopProductsAgg,
  countShopProductsAgg,
} from "../../repo/product.repo.js";
import { getAllListedBrands } from "../../../brand/brand.repo.js";
import { markWishlistStatus } from "../../../wishlist/wishlist.helper.js";
import { fetchWishlistItems } from "../../../wishlist/wishlist.repo.js";

export const loadShopService = async (query, userId = null) => {
  const search = query.search || "";
  const brand = query.brand || "all";
  const sort = query.sort || "";
  const minPrice = query.min;
  const maxPrice = query.max;
  const currentPage = parseInt(query.page) || 1;

  const limit = 3;
  const skip = (currentPage - 1) * limit;

  // ---------------- MATCH ----------------
  const matchStage = {
    isListed: true,
    "brands.isListed": true,
  };

  if (brand !== "all") {
    matchStage["brands.brandName"] = brand;
  }

  if (search) {
    matchStage.name = { $regex: search.trim(), $options: "i" };
  }

  // ---------------- SORT ----------------
  const sortStage = {};
  if (sort === "price-asc") sortStage["variants.salePrice"] = 1;
  else if (sort === "price-desc") sortStage["variants.salePrice"] = -1;
  else if (sort === "a-z") sortStage.name = 1;
  else if (sort === "z-a") sortStage.name = -1;
  else if (sort === "latest") sortStage.updatedAt = -1;

  // ---------------- PRICE FILTER ----------------
  const priceStage = {};
  if (minPrice) priceStage.$gte = Number(minPrice);
  if (maxPrice) priceStage.$lte = Number(maxPrice);

  // ---------------- BASE PIPELINE ----------------
  const basePipeline = [
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
  ];

  if (Object.keys(sortStage).length) {
    basePipeline.push({ $sort: sortStage });
  }

  if (Object.keys(priceStage).length) {
    basePipeline.push({ $match: { "variants.salePrice": priceStage } });
  }

  // ---------------- COUNT ----------------
  const countPipeline = structuredClone(basePipeline);
  countPipeline.push({ $count: "totalDocuments" });

  const countResult = await countShopProductsAgg(countPipeline);
  const totalDocuments =
    countResult.length > 0 ? countResult[0].totalDocuments : 0;

  const totalPages = Math.ceil(totalDocuments / limit);

  // ---------------- CART STATUS (LOGGED IN USER) ----------------
  if (userId) {
    basePipeline.push(
      {
        $lookup: {
          from: "carts",
          let: { productId: "$_id", userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$userId",  "$$userId" ] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "cart",
        },
      },
      { $unwind: { path: "$cart", preserveNullAndEmptyArrays: true } },
      { $addFields: { cart: "$cart._id" } }
    );
  }

  // ---------------- PAGINATION ----------------
  const productPipeline = structuredClone(basePipeline);
  productPipeline.push({ $skip: skip }, { $limit: limit });

  const products = await getShopProductsAgg(productPipeline);

  const wishlistItems = userId ? await fetchWishlistItems(userId) : [];
  const shopProducts = await markWishlistStatus(products, wishlistItems);

  const brands = await getAllListedBrands();

  return {
    products: shopProducts,
    brands,
    pagination: {
      currentPage,
      totalPages,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  };
};
