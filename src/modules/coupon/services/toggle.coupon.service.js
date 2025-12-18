import { toggleCouponStatus } from "../repo/coupon.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { CouponMessages } from "../../../shared/constants/messages/couponMessages.js";

export const toggleCouponStatusService = async (couponId) => {
  const coupon = await toggleCouponStatus(couponId);
  if (!coupon) {
    throw new AppError(CouponMessages.COUPON_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return coupon;
};
