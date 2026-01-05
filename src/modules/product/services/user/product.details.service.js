import {
  findVariantByIdAgg,
} from "../../repo/variant.repo.js";
import { getSingleProductAgg } from "../../repo/product.repo.js";
import {
  getAppliedOffer,
  groupVariantsByColor,
} from "../../helpers/user.product.helper.js";
import { getLatestProducts } from "../product.common.service.js";
import { ProductMessages } from "../../../../shared/constants/messages/productMessages.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { fetchWishlist } from "../../../wishlist/wishlist.repo.js";
import {
  findReviewsByProductId,
  getProductRatingSummary,
} from "../../../reviews/reviews.repo.js";

// Product details service - fetch product details for user view
// Load product with selected variant and recommendations
export const loadProductDetailsService = async (
  params,
  userId = null
) => {
  let selectedVariant = await findVariantByIdAgg(params.variantId, userId);

  selectedVariant = selectedVariant?.[0];

  if (!selectedVariant) {
    throw new AppError(ProductMessages.VARIANT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Fetch product aggregation
  const productAgg = await getSingleProductAgg(
    selectedVariant.productId,
    userId
  );

  if (!productAgg.length) {
    throw new AppError(ProductMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const product = productAgg[0];

  // Calculate applied offer
  const offer = getAppliedOffer(product, selectedVariant.salePrice);
  let isInWishlist = null;
  if (userId) {
    const wishlist = userId ? await fetchWishlist(userId) : null;
    const wishlistVariantSet = new Set(
      wishlist?.items.map((item) => item.variantId.toString())
    );
    isInWishlist = wishlistVariantSet?.has(selectedVariant._id.toString());
  }

  // Group variants by color
  const colorGroups = groupVariantsByColor(product.variants);

  // Fetch related products
  const relatedProducts = await getLatestProducts(6, userId);

  // Fetch product reviews
  const reviews = await findReviewsByProductId(product._id, 10);

  // Rating summary
  const { avgRating } = await getProductRatingSummary(product._id);

  return {
    isInWishlist,
    offer,
    product,
    selectedVariant,
    colorGroups,
    relatedProducts,
    reviews: reviews.map((review) => ({
      userName: review.userId?.name || "User",
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
    })),
    avgRating,
  };
};
