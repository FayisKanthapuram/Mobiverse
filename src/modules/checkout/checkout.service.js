import { fetchCartItems } from "../cart/cart.repo.js";
import { calculateCartTotals } from "../cart/helpers/cartTotals.helper.js";
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
import { getAppliedOffer } from "../product/helpers/user.product.helper.js";
import { CouponMessages } from "../../shared/constants/messages/couponMessages.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";

/* ----------------------------------------------------
   LOAD CHECKOUT SERVICE
---------------------------------------------------- */
export const loadCheckoutService = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(UserMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const addresses = await findUserAddresses(userId);
  const items = await fetchCartItems(userId);
  // ---------------- OFFERS ----------------
  for (let item of items) {
    item.offer = getAppliedOffer(item, item?.variantId?.salePrice)||0;
  }
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
    throw new AppError(CouponMessages.COUPON_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (!coupon.isActive) {
    throw new AppError(CouponMessages.COUPON_NOT_ACTIVE, HttpStatus.GONE);
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new AppError(CouponMessages.COUPON_EXPIRED, HttpStatus.GONE);
  }

  if (coupon.totalUsageLimit > 0) {
    const totalUsed = await countCouponUsageByCouponId(coupon._id);
    if (totalUsed >= coupon.totalUsageLimit) {
      throw new AppError(CouponMessages.COUPON_USAGE_LIMIT_EXCEEDED, HttpStatus.FORBIDDEN);
    }
  }

  if (coupon.usageLimitPerUser > 0) {
    const userUsed = await countCouponUsageByCouponIdAndUserId(
      coupon._id,
      userId
    );
    if (userUsed >= coupon.usageLimitPerUser) {
      throw new AppError(
        CouponMessages.COUPON_ALREADY_USED,
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
        CouponMessages.COUPON_NOT_ELIGIBLE,
        HttpStatus.FORBIDDEN
      );
    }
  }

  if (coupon.userEligibility === "new_users") {
    const previousUsage = await countCouponUsageByUserId(userId);
    if (previousUsage > 0) {
      throw new AppError(
        CouponMessages.COUPON_NEW_USERS_ONLY,
        HttpStatus.FORBIDDEN
      );
    }
  }

  if (totalAmount < coupon.minPurchaseAmount) {
    throw new AppError(
      CouponMessages.COUPON_MIN_PURCHASE.replace("{amount}", String(coupon.minPurchaseAmount)),
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
    if(coupon.discountValue>totalAmount*.9)discount=totalAmount*.9;
    else discount = coupon.discountValue;
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
