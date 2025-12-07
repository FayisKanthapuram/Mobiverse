import { findAndUpdateCoupon, findCouponByCode, findCouponById } from "../../../modules/coupon/coupon.repo.js";

export const editCouponService = async (data,couponId) => {
  try {
    const coupon=await findCouponById(couponId);
    
    if(coupon.code!==data.code){
      //exist
      const existing = await findCouponByCode(data.code);
      if (existing) {
        const error = new Error("Coupon code already in use");
        error.status = 400;
        throw error;
      }
    }
  
    await findAndUpdateCoupon(couponId,data);
  
    return;
  } catch (error) {
    throw error;
  }
};
