import { createCoupon, findCouponByCode } from "../../repositories/coupon.repo.js";

export const addCouponService = async (data) => {
  try {
    //exist
    const existing = await findCouponByCode(data.code);
    if (existing.length!==0) {
      const error = new Error("Coupon code already in use");
      error.status = 400;
      throw error;
    }
  
    await createCoupon(data);
  
    return;
  } catch (error) {
    throw error;
  }
};
