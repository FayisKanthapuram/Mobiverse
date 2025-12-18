import { aggregateProductById } from "../../repo/product.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { ProductMessages } from "../../../../shared/constants/messages/productMessages.js";

export const getProductByIdService = async (productId) => {
  const arr = await aggregateProductById(productId);
  const product = arr[0];

  if (!product) {
    throw new AppError(ProductMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return product;
};
