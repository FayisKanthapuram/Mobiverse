import { findVariantsByProduct } from "../../product/repo/variant.repo.js";
import { findOfferById } from "../offer.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

// Get offer by id service - enrich products with pricing/image
export const getOfferByIdService = async (id) => {
  const offer = await findOfferById(id);
  if (!offer) {
    throw new AppError("Offer not found", HttpStatus.NOT_FOUND);
  }

  for (const product of offer.productID) {
    const variants = await findVariantsByProduct(product._id);
    product.minPrice = Infinity;

    for (const variant of variants) {
      product.minPrice = Math.min(product.minPrice, variant.salePrice);
    }

    product.image = variants[0]?.images?.[0];
  }

  return offer;
};
