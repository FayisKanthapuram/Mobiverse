import { fetchCartItems } from "../repositories/cart.repo.js";
import { calculateCartTotals } from "../helpers/cartTotals.helper.js";
import { getLatestProductsAgg } from "../repositories/product.repo.js";

export const loadCartService = async (userId) => {
  // Related products recommendation
  const relatedProducts = await getLatestProductsAgg(5);

  // Fetch cart items for this user
  const items = await fetchCartItems(userId);

  // Calculate totals + fix invalid quantity
  const cartTotals = await calculateCartTotals(items);

  return {
    relatedProducts,
    cart: cartTotals,
  };
};
