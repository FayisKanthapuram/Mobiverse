import { createCoupon, findCouponByCode } from "../repo/coupon.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { CouponMessages } from "../../../shared/constants/messages/couponMessages.js";

export const addCouponService = async (data) => {
  const existing = await findCouponByCode(data.code);
  if (existing) {
    throw new AppError(CouponMessages.COUPON_CODE_EXISTS, HttpStatus.BAD_REQUEST);
  }

  await createCoupon(data);
  return true;
};
