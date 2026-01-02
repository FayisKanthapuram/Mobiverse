import { findProductById } from "../../repo/product.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { ProductMessages } from "../../../../shared/constants/messages/productMessages.js";

// Toggle product service - activate/deactivate product
// Toggle product listed status
export const toggleProductService = async (productId) => {
  const product = await findProductById(productId);
  if (!product) {
    throw new AppError(ProductMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  product.isListed = !product.isListed;
  await product.save();

  return true;
};
