import couponUsageModel from "../models/coupon.usage.model.js";

// Coupon usage repo - count and create usage records
export const countCouponUsageByCouponId = (couponId) => {
  return couponUsageModel.countDocuments({ couponId });
};

export const countCouponUsageByCouponIdAndUserId = (couponId, userId) => {
  return couponUsageModel.countDocuments({ couponId, userId });
};

export const countCouponUsageByUserId = (userId) => {
  return couponUsageModel.countDocuments({ userId });
};

export const couponUsageCreate = (
  couponId,
  userId,
  orderId,
  discountAmount,
  session = null
) => {
  const options = session ? { session } : {};
  return couponUsageModel.create(
    [{ couponId, userId, orderId, discountAmount }],
    options
  );
};
