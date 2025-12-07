import {
  aggregateProductById,
} from "../repo/product.repo.js";

export const getProductByIdService = async (productId) => {
  const arr = await aggregateProductById(productId);
  return arr[0] || null;
};
