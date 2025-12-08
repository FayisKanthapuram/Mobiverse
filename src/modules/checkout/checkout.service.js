import { fetchCartItems } from "../cart/cart.repo.js";
import { calculateCartTotals } from "../cart/cartTotals.helper.js";
import { findUserAddresses } from "../address/address.repo.js";
import {
  findCouponByCode,
  getAvailableCoupon,
} from "../coupon/repo/coupon.repo.js";
import { applyCouponSchema } from "../coupon/coupon.validator.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import couponUsageModel from "../coupon/models/couponUsageModel.js";
import { countCouponUsageByCouponId, countCouponUsageByCouponIdAndUserId, countCouponUsageByUserId } from "../coupon/repo/coupon.usage.repo.js";
import { findUserById } from "../user/user.repo.js";

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

export const applyCouponService = async (body, userId) => {
  const { error } = applyCouponSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: error.details[0].message,
    };
  }

  const { code, totalAmount } = body;

  const coupon = await findCouponByCode(code.toUpperCase());
  if (!coupon) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Invalid coupon",
    };
  }

  if (!coupon.isActive) {
    return {
      status: HttpStatus.GONE,
      success: false,
      message: "Coupon is not active",
    };
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    return {
      status: HttpStatus.GONE,
      success: false,
      message: "Coupon is expired or not yet started",
    };
  }

  if (coupon.totalUsageLimit > 0) {
    const totalUsed = await countCouponUsageByCouponId(coupon._id)

    if (totalUsed >= coupon.totalUsageLimit) {
      return {
        status: HttpStatus.FORBIDDEN,
        success: false,
        message: "Coupon usage limit exceeded",
      };
    }
  }

  if (coupon.usageLimitPerUser > 0) {
    const userUsed = await countCouponUsageByCouponIdAndUserId(coupon._id,userId)

    if (userUsed >= coupon.usageLimitPerUser) {
      return {
        status: HttpStatus.FORBIDDEN,
        success: false,
        message: "You have already used this coupon",
      };
    }
  }

  if (coupon.userEligibility === "specific") {
    const isAllowed = coupon.specificUsers.some(
      (id) => id.toString() === userId.toString()
    );
    if (!isAllowed) {
      return {
        status: HttpStatus.FORBIDDEN,
        success: false,
        message: "You are not eligible for this coupon",
      };
    }
  }

  if (coupon.userEligibility === "new_users") {
    const previousUsage = await countCouponUsageByUserId(userId)

    if (previousUsage > 0) {
      return {
        status: HttpStatus.FORBIDDEN,
        success: false,
        message: "This coupon is only for new users",
      };
    }
  }

  if (totalAmount < coupon.minPurchaseAmount) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: `Minimum purchase amount is ₹${coupon.minPurchaseAmount}`,
    };
  }

  let discount = 0;

  if (coupon.type === "percentage") {
    discount = (coupon.discountValue / 100) * totalAmount;

    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    // fixed type
    discount = coupon.discountValue;
  }
  const finalAmount = Math.max(totalAmount - discount, 0);

  return {
    status: HttpStatus.OK,
    success: true,
    data: {
      couponId: coupon._id,
      discount,
      finalAmount,
      couponType:coupon.type,
      couponValue:coupon.discountValue,
    },
  };
};
