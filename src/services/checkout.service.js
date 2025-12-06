import { fetchCartItems } from "../repositories/cart.repo.js";
import { calculateCartTotals } from "../helpers/cartTotals.helper.js";
import { findUserById } from "../repositories/user.repo.js";
import { findUserAddresses } from "../repositories/address.repo.js";
import { findCouponByCode, getAvailableCoupon } from "../repositories/coupon.repo.js";
import { applyCouponSchema } from "../validators/coupon.validator.js";
import { HttpStatus } from "../constants/statusCode.js";

export const loadCheckoutService = async (userId) => {
  const user = await findUserById(userId);
  const addresses = await findUserAddresses(userId);
  // Fetch cart items for this user
  const items = await fetchCartItems(userId);

  // Calculate totals + fix invalid quantity
  const cartTotals = await calculateCartTotals(items);

  let hasAdjustedItem = items.some((item) => item.adjusted);
  const now = new Date();
  const availableCoupons = await getAvailableCoupon(userId, now);

  return {
    user,
    addresses,
    cartTotals,
    hasAdjustedItem,
    availableCoupons,
  };
};

export const applyCouponService = async (body) => {
  const { error } = applyCouponSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: error.details[0].message,
    };
  }
  const {code,totalAmount}=req.body;
  const coupon=await findCouponByCode(code);
  if(!coupon){
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: 'Invalid coupon',
    };
  }


};
