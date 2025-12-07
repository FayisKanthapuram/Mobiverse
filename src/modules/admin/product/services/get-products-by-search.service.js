import {
  findProducts,
} from "../repo/product.repo.js";

/**
 * Search products for select/search endpoints
 */
export const getProductsBySearch = async (q = "") => {
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  return findProducts(query, { name: 1 }, 0, 20).populate('brandID');
};
