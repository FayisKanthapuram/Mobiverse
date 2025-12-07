import { findCouponById } from "../../../modules/coupon/coupon.repo.js"

export const getCouponService=async(couponId)=>{
  const coupon=await findCouponById(couponId).populate('specificUsers');
  return coupon;
}