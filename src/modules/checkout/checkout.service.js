import { fetchCartItems } from "../cart/cart.repo.js";
import { calculateCartTotals } from "../cart/cartTotals.helper.js";
import { findUserAddresses } from "../address/address.repo.js";
import {
  findCouponByCode,
  getAvailableCoupon,
} from "../coupon/repo/coupon.repo.js";
import { applyCouponSchema } from "../coupon/coupon.validator.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  countCouponUsageByCouponId,
  countCouponUsageByCouponIdAndUserId,
  countCouponUsageByUserId,
} from "../coupon/repo/coupon.usage.repo.js";
import { findUserById } from "../user/user.repo.js";
import { AppError } from "../../shared/utils/app.error.js";

/* ----------------------------------------------------
   LOAD CHECKOUT SERVICE
---------------------------------------------------- */
export const loadCheckoutService = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", HttpStatus.NOT_FOUND);
  }

  const addresses = await findUserAddresses(userId);
  const items = await fetchCartItems(userId);
  const cartTotals = await calculateCartTotals(items);

  const hasAdjustedItem = items.some((item) => item.adjusted);
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

/* ----------------------------------------------------
   APPLY COUPON SERVICE
---------------------------------------------------- */
export const applyCouponService = async (body, userId) => {
  const { error } = applyCouponSchema.validate(body);
  if (error) {
    throw new AppError(
      error.details[0].message,
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  const { code, totalAmount } = body;

  const coupon = await findCouponByCode(code.toUpperCase());
  if (!coupon) {
    throw new AppError("Invalid coupon", HttpStatus.NOT_FOUND);
  }

  if (!coupon.isActive) {
    throw new AppError("Coupon is not active", HttpStatus.GONE);
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new AppError("Coupon is expired or not yet started", HttpStatus.GONE);
  }

  if (coupon.totalUsageLimit > 0) {
    const totalUsed = await countCouponUsageByCouponId(coupon._id);
    if (totalUsed >= coupon.totalUsageLimit) {
      throw new AppError("Coupon usage limit exceeded", HttpStatus.FORBIDDEN);
    }
  }

  if (coupon.usageLimitPerUser > 0) {
    const userUsed = await countCouponUsageByCouponIdAndUserId(
      coupon._id,
      userId
    );
    if (userUsed >= coupon.usageLimitPerUser) {
      throw new AppError(
        "You have already used this coupon",
        HttpStatus.FORBIDDEN
      );
    }
  }

  if (coupon.userEligibility === "specific") {
    const allowed = coupon.specificUsers.some(
      (id) => id.toString() === userId.toString()
    );
    if (!allowed) {
      throw new AppError(
        "You are not eligible for this coupon",
        HttpStatus.FORBIDDEN
      );
    }
  }

  if (coupon.userEligibility === "new_users") {
    const previousUsage = await countCouponUsageByUserId(userId);
    if (previousUsage > 0) {
      throw new AppError(
        "This coupon is only for new users",
        HttpStatus.FORBIDDEN
      );
    }
  }

  if (totalAmount < coupon.minPurchaseAmount) {
    throw new AppError(
      `Minimum purchase amount is ₹${coupon.minPurchaseAmount}`,
      HttpStatus.BAD_REQUEST
    );
  }

  let discount = 0;

  if (coupon.type === "percentage") {
    discount = (coupon.discountValue / 100) * totalAmount;
    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  const finalAmount = Math.max(totalAmount - discount, 0);

  return {
    couponId: coupon._id,
    discount,
    finalAmount,
    couponType: coupon.type,
    couponValue: coupon.discountValue,
  };
};
