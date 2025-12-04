import { fetchCartItems } from "../repositories/cart.repo.js";
import { calculateCartTotals } from "../helpers/cartTotals.helper.js";
import { findUserById } from "../repositories/user.repo.js";
import { findUserAddresses } from "../repositories/address.repo.js";
import { getAvailableCoupon } from "../repositories/coupon.repo.js";

export const loadCheckoutService = async (userId) => {

  const user=await findUserById(userId)
  const addresses=await findUserAddresses(userId);
  // Fetch cart items for this user
  const items = await fetchCartItems(userId);
  
  // Calculate totals + fix invalid quantity
  const cartTotals = await calculateCartTotals(items);

  let hasAdjustedItem=items.some(item=>item.adjusted);
  
  const availableCoupons=await getAvailableCoupon()
  
  return {
    user,
    addresses,
    cartTotals,
    hasAdjustedItem,
    availableCoupons
  };
};