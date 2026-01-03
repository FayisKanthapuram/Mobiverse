import { findUserCart } from "../../cart/cart.repo.js";
import { markCartStatus } from "../../cart/helpers/cart.helper.js";
import { markWishlistStatus } from "../../wishlist/wishlist.helper.js";
import { fetchWishlist } from "../../wishlist/wishlist.repo.js";
import { getAppliedOffer } from "../helpers/user.product.helper.js";
import {
  getFeaturedProductsAgg,
  getLatestProductsAgg,
} from "../repo/product.repo.js";

// Product common service - shared product operations
// Get latest products with offers and cart/wishlist status
export const getLatestProducts = async (limit, userId) => {
  const latestProducts = await getLatestProductsAgg(limit, userId);
  for (let product of latestProducts) {
    product.offer = getAppliedOffer(product, product?.variants?.salePrice);
  }

  // Attach wishlist and cart status
  const wishlist = userId ? await fetchWishlist(userId) : null;
  const cart = userId ? await findUserCart(userId) : null;

  let finalProducts = markWishlistStatus(latestProducts, wishlist);
  finalProducts = markCartStatus(finalProducts, cart);
  return finalProducts;
};

// Get featured products with offers and cart/wishlist status
export const getFeaturedProducts = async (userId) => {
  const featuredProducts = await getFeaturedProductsAgg(userId);
  for (let product of featuredProducts) {
    product.offer = getAppliedOffer(product, product?.variants?.salePrice);
  }

  // Attach wishlist and cart status
  const wishlist = userId ? await fetchWishlist(userId) : null;
  const cart = userId ? await findUserCart(userId) : null;

  let finalProducts = markWishlistStatus(featuredProducts, wishlist);
  finalProducts = markCartStatus(finalProducts, cart);

  return finalProducts;
};
