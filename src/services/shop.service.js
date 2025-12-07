import {
  getShopProductsAgg,
  countShopProductsAgg,
} from "../repositories/product.repo.js";
import { getAllListedBrands } from "../modules/brand/brand.repo.js";

export const loadShopService = async (query, userId) => {
  const search = query.search || "";
  const brand = query.brand || "all";
  const sort = query.sort || "";
  const minPrice = query.min;
  const maxPrice = query.max;
  const currentPage = parseInt(query.page) || 1;

  const limit = 3;
  const skip = (currentPage - 1) * limit;

  // MATCH conditions
  const matchStage = {
    "brands.isListed": true,
    isListed: true,
  };

  if (brand !== "all") {
    matchStage["brands.brandName"] = brand;
  }

  if (search) {
    matchStage["name"] = { $regex: search.trim(), $options: "i" };
  }

  // SORT conditions
  const sortStage = {};
  if (sort === "price-asc") sortStage["variants.salePrice"] = 1;
  else if (sort === "price-desc") sortStage["variants.salePrice"] = -1;
  else if (sort === "a-z") sortStage["name"] = 1;
  else if (sort === "z-a") sortStage["name"] = -1;
  else if (sort === "latest") sortStage["updatedAt"] = -1;

  // PRICE filter
  const priceStage = {};
  if (minPrice) priceStage["$gte"] = Number(minPrice);
  if (maxPrice) priceStage["$lte"] = Number(maxPrice);

  // Base pipeline
  const basePipeline = [
    {
      $lookup: {
        from: "brands",
        foreignField: "_id",
        localField: "brandID",
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
    // Product Offer
    {
      $lookup: {
        from: "offers",
        let: {
          productId: "$_id",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "productOffer",
      },
    },
    {
      $unwind: {
        path: "$productOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { productOffer: "$productOffer.offer" } },

    // Brand Offer
    {
      $lookup: {
        from: "offers",
        let: {
          brandID: "$brandID",
          today: new Date(),
          salePrice: "$variants.salePrice",
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
          {
            $project: {
              _id: 0,
              offer: {
                $cond: {
                  if: { $eq: ["$discountType", "percentage"] },
                  then: { $multiply: ["$$salePrice", "$discountValue", 0.01] },
                  else: "$discountValue",
                },
              },
            },
          },
          { $sort: { offer: -1 } },
          { $limit: 1 },
        ],
        as: "brandOffer",
      },
    },
    {
      $unwind: {
        path: "$brandOffer",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { brandOffer: "$brandOffer.offer" } },

    // Final offer selection
    {
      $addFields: {
        offer: {
          $ceil: {
            $cond: {
              if: { $gte: ["$brandOffer", "$productOffer"] },
              then: "$brandOffer",
              else: "$productOffer",
            },
          },
        },
      },
    },
  ];

  // Add sorting
  if (Object.keys(sortStage).length > 0) {
    basePipeline.push({ $sort: sortStage });
  }

  // Add price filter
  if (Object.keys(priceStage).length > 0) {
    basePipeline.push({ $match: { "variants.salePrice": priceStage } });
  }

  // COUNT pipeline
  const countPipeline = structuredClone(basePipeline);
  countPipeline.push({ $count: "totalDocuments" });

  const countResult = await countShopProductsAgg(countPipeline);
  const totalDocuments =
    countResult.length > 0 ? countResult[0].totalDocuments : 0;

  const totalPages = Math.ceil(totalDocuments / limit);

  // Add cart status only if user logged in
  if (userId) {
    basePipeline.push(
      {
        $lookup: {
          from: "carts",
          let: {
            productId: "$_id",
            userId: userId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$userId", { $toObjectId: "$$userId" }] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "cart",
        },
      },
      {
        $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: { cart: "$cart._id" },
      }
    );
  }
  // PAGINATED DATA
  const productPipeline = structuredClone(basePipeline);
  productPipeline.push({ $skip: skip }, { $limit: limit });

  const products = await getShopProductsAgg(productPipeline);

  // BRANDS
  const brands = await getAllListedBrands();

  return {
    products,
    brands,
    pagination: {
      currentPage,
      totalPages,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  };
};
