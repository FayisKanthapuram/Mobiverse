import couponUsageModel from "./couponUsageModel.js";

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
  discountAmount
) => {
  return couponUsageModel.create({ couponId, userId, orderId, discountAmount });
};
