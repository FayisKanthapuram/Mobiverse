import { toggleCouponStatus } from "../../repositories/coupon.repo.js";

export const toggleCouponStatusService = async (couponId) => {
  try {
    const coupon = await toggleCouponStatus(couponId);

    if (!coupon) {
      const err = new Error("Coupon not found");
      err.status = 404;
      throw err;
    }
    return coupon;
  } catch (error) {
    throw error;
  }
};
