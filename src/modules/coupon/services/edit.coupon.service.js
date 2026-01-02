import {
  findAndUpdateCoupon,
  findCouponByCode,
  findCouponById,
} from "../repo/coupon.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { CouponMessages } from "../../../shared/constants/messages/couponMessages.js";

// Edit coupon service - validate and update coupon
export const editCouponService = async (data, couponId) => {
  const coupon = await findCouponById(couponId);
  if (!coupon) {
    throw new AppError(CouponMessages.COUPON_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (coupon.code !== data.code) {
    const existing = await findCouponByCode(data.code);
    if (existing) {
      throw new AppError(CouponMessages.COUPON_CODE_EXISTS, HttpStatus.BAD_REQUEST);
    }
  }

  await findAndUpdateCoupon(couponId, data);
  return true;
};
