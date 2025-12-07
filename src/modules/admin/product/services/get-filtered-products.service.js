import {
  findProducts,
  countProducts,
} from "../repo/product.repo.js";
import {
  findAllListedBrands,
} from "../../brand/brand.repo.js";

/**
 * Get filtered products for admin listing
 */
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
    findProducts(query, { createdAt: -1 }, skip, limit).populate("brandID"),
    countProducts(query),
    findAllListedBrands(),
  ]);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    products,
    totalDocuments,
    totalPages,
    limit,
    brands,
  };
};
