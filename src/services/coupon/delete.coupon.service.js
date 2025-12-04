import {
  deleteCoupon,
  findCouponById,
} from "../../repositories/coupon.repo.js";

export const deleteCouponService = async (couponId) => {
  try {
    const coupon = await findCouponById(couponId);

    if (!coupon) {
      const err = new Error("Coupon not found");
      err.status = 404;
      throw err;
    }

    await deleteCoupon(couponId);
  } catch (error) {
    throw error;
  }
};
