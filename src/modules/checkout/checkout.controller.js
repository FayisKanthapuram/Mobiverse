import { HttpStatus } from "../../shared/constants/statusCode.js";
import { applyCouponService, loadCheckoutService } from "./checkout.service.js";

/* ----------------------------------------------------
   LOAD CHECKOUT
---------------------------------------------------- */
export const loadCheckOut = async (req, res) => {
  const data = await loadCheckoutService(req?.user?._id);
  const appliedCoupon = req.session.appliedCoupon || null;

  if (data.hasAdjustedItem) {
    return res.redirect("/cart?message=adjusted");
  }

  res.status(HttpStatus.OK).render("user/checkout", {
    pageTitle: "Checkout",
    pageJs: "checkout",
    addresses: data.addresses,
    user: data.user,
    cart: data.cartTotals,
    availableCoupons: data.availableCoupons,
    appliedCoupon,
  });
};

/* ----------------------------------------------------
   APPLY COUPON
---------------------------------------------------- */
export const applyCoupon = async (req, res) => {
  if (req.session.appliedCoupon) req.session.appliedCoupon = null;

  const result = await applyCouponService(req.body, req?.user?._id);

  req.session.appliedCoupon = {
    couponId: result.couponId,
    discount: result.discount,
    finalAmount: result.finalAmount,
    code: req.body.code.toUpperCase(),
    couponType: result.couponType,
    couponValue: result.couponValue,
  };

  res.status(HttpStatus.OK).json({ success: true });
};

/* ----------------------------------------------------
   REMOVE COUPON
---------------------------------------------------- */
export const removeCoupon = (req, res) => {
  req.session.appliedCoupon = null;

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Coupon removed",
  });
};
