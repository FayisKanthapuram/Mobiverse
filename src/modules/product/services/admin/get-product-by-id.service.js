import { aggregateProductById } from "../../repo/product.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";

export const getProductByIdService = async (productId) => {
  const arr = await aggregateProductById(productId);
  const product = arr[0];

  if (!product) {
    throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  }

  return product;
};
