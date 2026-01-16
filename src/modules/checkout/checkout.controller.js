import { HttpStatus } from "../../shared/constants/statusCode.js";
import { applyCouponService, loadCheckoutService } from "./checkout.service.js";
import { CouponMessages } from "../../shared/constants/messages/couponMessages.js";
import { CheckoutMessages } from "../../shared/constants/messages/checkoutMessages.js";
// Checkout controller - handle checkout and coupon endpoints

// Render checkout page
export const loadCheckOut = async (req, res) => {
  const data = await loadCheckoutService(req?.user?._id);
  const appliedCoupon = req.session.appliedCoupon || null;

  // 🚫 BLOCK checkout if pending Razorpay payment exists
  if (data.hasPendingPayment) {
    return res.redirect(`/order/failure/${data.tempOrderId}`);
  }

  // ✅ existing cart adjustment logic
  if (data.cartTotals.hasAdjustedItem) {
    req.session.toast = {
      type: "warning",
      message: CheckoutMessages.ADJUSTED_ITEM_QUANTITIES,
    };
    return res.redirect("/cart");
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


// Apply a coupon to the current cart
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

  res
    .status(HttpStatus.OK)
    .json({ success: true, message: CouponMessages.COUPON_APPLIED });
};

// Remove applied coupon from session
export const removeCoupon = (req, res) => {
  req.session.appliedCoupon = null;

  res.status(HttpStatus.OK).json({
    success: true,
    message: CouponMessages.COUPON_REMOVED,
  });
};
