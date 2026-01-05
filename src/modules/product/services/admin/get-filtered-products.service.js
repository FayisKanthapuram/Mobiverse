import { findProducts, countProducts } from "../../repo/product.repo.js";
import { findAllListedBrands } from "../../../brand/brand.repo.js";
import { findVariantsByProduct } from "../../repo/variant.repo.js";
import { getAvgRatingsByProductIds } from "../../../reviews/reviews.repo.js";

// Get filtered products service - fetch and filter products for admin
// Retrieve products with filters and pagination
export const getFilteredProducts = async ({
  search = "",
  status = "All",
  brand = "",
  page = 1,
  limit = 5,
}) => {
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * limit;

  const query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (status === "listed") query.isListed = true;
  if (status === "unlisted") query.isListed = false;
  if (brand) query.brandID = brand;

  const [products, totalDocuments, brands] = await Promise.all([
    findProducts(query, { createdAt: -1 }, skip, limit)
      .populate("brandID")
      .lean(),
    countProducts(query),
    findAllListedBrands(),
  ]);

  //  Fetch avg ratings in ONE query
  const ratingData = await getAvgRatingsByProductIds(
    products.map((p) => p._id)
  );

  const ratingMap = new Map(
    ratingData.map((r) => [r._id.toString(), r.avgRating])
  );

  //  Variants + rating mapping
  for (let product of products) {
    const variants = await findVariantsByProduct(product._id);

    product.totalStock = 0;
    product.minPrice = Infinity;
    product.maxPrice = -Infinity;

    for (let variant of variants) {
      product.totalStock += variant.stock;
      product.minPrice = Math.min(product.minPrice, variant.salePrice);
      product.maxPrice = Math.max(product.maxPrice, variant.salePrice);
    }

    product.image = variants[0]?.images?.[0] || null;

    product.avgRating = Number(
      (ratingMap.get(product._id.toString()) || 0).toFixed(1)
    );
  }

  return {
    products,
    totalDocuments,
    totalPages: Math.ceil(totalDocuments / limit),
    limit,
    brands,
  };
};

