import {
  findProductById,
} from "../repo/product.repo.js";

export const toggleProductService = async (productId) => {
  const product = await findProductById(productId);
  if (!product) throw new Error("Product not found");
  product.isListed = !product.isListed;
  await product.save();
  return { success: true };
};
