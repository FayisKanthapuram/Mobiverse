import {
  findVariantByColor,
  findVariantByIdAgg,
} from "../../../admin/product/repo/variant.repo.js";

import {
  getSingleProductAgg,
  getLatestProductsAgg,
} from "../../../admin/product/repo/product.repo.js";

import { getAppliedOffer, groupVariantsByColor } from "../product.helper.js";

export const loadProductDetailsService = async (params, query,userId=null) => {

  // 1. Determine selected variant
  let selectedVariant;

  if (query.color) {
    selectedVariant = await findVariantByColor(query.color,params.variantId,userId);
  } else {
    selectedVariant = await findVariantByIdAgg(params.variantId,userId);
  }
  selectedVariant=selectedVariant[0]

  if (!selectedVariant) {
    const error = new Error("Variant not found");
    error.status = 404;
    throw error;
  }

  // 2. Fetch product with variants
  const productData = await getSingleProductAgg(selectedVariant.productId,userId);
  if (!productData.length) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  const product = productData[0];

  const offer=getAppliedOffer(product,selectedVariant.salePrice);

  // 3. Group variants by color
  const colorGroups = groupVariantsByColor(product.variants);

  // 4. Get Related Products
  const relatedProducts = await getLatestProductsAgg(6,userId);

  // 5. Static reviews (temporary)
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
    offer,
    product,
    selectedVariant,
    colorGroups,
    relatedProducts,
    reviews,
  };
};
