import {
  getShopProductsAgg,
  countShopProductsAgg,
} from "../../repo/product.repo.js";
import { getAllListedBrands } from "../../../brand/brand.repo.js";
import { markWishlistStatus } from "../../../wishlist/wishlist.helper.js";
import { fetchWishlist } from "../../../wishlist/wishlist.repo.js";
import { findUserCart } from "../../../cart/cart.repo.js";
import { markCartStatus } from "../../../cart/helpers/cart.helper.js";
import { getAppliedOffer } from "../../helpers/user.product.helper.js";

// Shop service - handle product browsing for users
// Load shop products with filters and sorting
export const loadShopService = async (query, userId = null) => {
  // Normalize and parse query parameters
  const search = query.search || "";
  const brand = query.brand || "all";
  const sort = query.sort || "";
  const minPrice = query.min;
  const maxPrice = query.max;
  const currentPage = parseInt(query.page, 10) || 1;

  const limit = 8;
  const skip = (currentPage - 1) * limit;

  // Define match stage for aggregation pipeline
  const matchStage = {
    isListed: true,
    "brands.isListed": true,
  };

  if (brand !== "all") matchStage["brands.brandName"] = brand;
  if (search) matchStage.name = { $regex: search.trim(), $options: "i" };

  // Define sort stage for aggregation pipeline
  const sortStage = {};
  if (sort === "price-asc") sortStage["variants.salePrice"] = 1;
  else if (sort === "price-desc") sortStage["variants.salePrice"] = -1;
  else if (sort === "a-z") sortStage.name = 1;
  else if (sort === "z-a") sortStage.name = -1;
  else if (sort === "latest") sortStage.updatedAt = -1;

  // Define price filter for aggregation pipeline
  const priceStage = {};
  if (minPrice) priceStage.$gte = Number(minPrice);
  if (maxPrice) priceStage.$lte = Number(maxPrice);

  // Define base aggregation pipeline for shop products
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
    //product offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
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
          brandID: "$brandID",
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
  ];

  // Count total matching products
  const countPipeline = [...basePipeline];
  if (Object.keys(sortStage).length) countPipeline.push({ $sort: sortStage });
  if (Object.keys(priceStage).length)
    countPipeline.push({ $match: { "variants.salePrice": priceStage } });
  countPipeline.push({ $count: "totalDocuments" });

  const countResult = await countShopProductsAgg(countPipeline);
  const totalDocuments = countResult[0]?.totalDocuments || 0;
  const totalPages = Math.ceil(totalDocuments / limit);

  // Build product page results
  const productPipeline = [...basePipeline];
  if (Object.keys(sortStage).length) productPipeline.push({ $sort: sortStage });
  if (Object.keys(priceStage).length)
    productPipeline.push({ $match: { "variants.salePrice": priceStage } });

  productPipeline.push({ $skip: skip }, { $limit: limit });

  const products = await getShopProductsAgg(productPipeline);

  // Apply offers to products
  for (let product of products) {
    product.offer = getAppliedOffer(product, product?.variants?.salePrice);
  }

  // Attach wishlist and cart status
  const wishlist = userId ? await fetchWishlist(userId) : null;
  const cart = userId ? await findUserCart(userId) : null;

  let finalProducts = markWishlistStatus(products, wishlist);
  finalProducts = markCartStatus(finalProducts, cart);

  const brands = await getAllListedBrands();

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
