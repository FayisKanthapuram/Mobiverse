import { markWishlistStatus } from "../../wishlist/wishlist.helper.js";
import { fetchWishlist } from "../../wishlist/wishlist.repo.js";
import { getFeaturedProductsAgg, getLatestProductsAgg } from "../repo/product.repo.js";

export const getLatestProducts=async(limit,userId)=>{
  const latestProducts = await getLatestProductsAgg(limit, userId);
  const wishlistItems = await fetchWishlist(userId);
  const productsWithWishlist = markWishlistStatus(
    latestProducts,
    wishlistItems
  );
  return productsWithWishlist;
}

export const getFeaturedProducts=async(userId)=>{
  const latestProducts = await getFeaturedProductsAgg( userId);
  const wishlistItems = await fetchWishlist(userId);
  const productsWithWishlist = markWishlistStatus(
    latestProducts,
    wishlistItems
  );
  return productsWithWishlist;
}