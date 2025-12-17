import { findProductById } from "../../repo/product.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";

export const toggleProductService = async (productId) => {
  const product = await findProductById(productId);
  if (!product) {
    throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  }

  product.isListed = !product.isListed;
  await product.save();

  return true;
};
