import {
  findVariantByColor,
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

export const loadProductDetailsService = async (
  params,
  query,
  userId = null
) => {
  // 1. Resolve variant
  let selectedVariant;

  if (query.color) {
    selectedVariant = await findVariantByColor(
      query.color,
      params.variantId,
      userId
    );
  } else {
    selectedVariant = await findVariantByIdAgg(params.variantId, userId);
  }

  selectedVariant = selectedVariant?.[0];

  if (!selectedVariant) {
    throw new AppError(ProductMessages.VARIANT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // 2. Fetch product
  const productAgg = await getSingleProductAgg(
    selectedVariant.productId,
    userId
  );

  if (!productAgg.length) {
    throw new AppError(ProductMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const product = productAgg[0];

  // 3. Offer calculation
  const offer = getAppliedOffer(product, selectedVariant.salePrice);
  let isInWishlist=null;
  if(userId){
    const wishlist = userId ? await fetchWishlist(userId) : null;
    const wishlistVariantSet = new Set(
      wishlist?.items.map((item) => item.variantId.toString())
    );
    isInWishlist = wishlistVariantSet?.has(
      selectedVariant._id.toString()
    );
  }

  // 4. Variant grouping
  const colorGroups = groupVariantsByColor(product.variants);

  // 5. Related products
  const relatedProducts = await getLatestProducts(6, userId);

  // 6. Temporary static reviews
  const reviews = [
    {
      userName: "Rahul Mehta",
      rating: 5,
      comment:
        "Amazing phone! The battery easily lasts me two days and the camera quality is top-notch.",
      date: new Date("2025-10-15"),
    },
    {
      userName: "Sneha Sharma",
      rating: 4,
      comment:
        "Very sleek and smooth performance. Only issue is a bit of heating while gaming.",
      date: new Date("2025-09-30"),
    },
    {
      userName: "Amit Verma",
      rating: 3,
      comment:
        "Good for casual use, but expected slightly better display brightness for the price.",
      date: new Date("2025-08-22"),
    },
    {
      userName: "Priya Nair",
      rating: 5,
      comment:
        "Absolutely love this device! The color and design are just perfect.",
      date: new Date("2025-11-01"),
    },
    {
      userName: "Karan Patel",
      rating: 4,
      comment:
        "Fast delivery and well-packed. Phone works perfectly fine so far.",
      date: new Date("2025-11-05"),
    },
  ];

  return {
    isInWishlist,
    offer,
    product,
    selectedVariant,
    colorGroups,
    relatedProducts,
    reviews,
  };
};
