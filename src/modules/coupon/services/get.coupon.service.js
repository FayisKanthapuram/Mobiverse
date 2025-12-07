import { findCouponById } from "../repo/coupon.repo.js"

export const getCouponService=async(couponId)=>{
  const coupon=await findCouponById(couponId).populate('specificUsers');
  return coupon;
}