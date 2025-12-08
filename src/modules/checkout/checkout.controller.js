import { HttpStatus } from "../../constants/statusCode.js";
import {
  applyCouponService,
  loadCheckoutService,
} from "./checkout.service.js";

export const laodCheckOut = async (req, res, next) => {
  try {
    const data = await loadCheckoutService(req.session.user);
    const appliedCoupon = req.session.appliedCoupon || null;

    if (data.hasAdjustedItem) {
      return res.redirect("/cart?message=adjested");
    }

    res.render("user/checkout", {
      pageTitle: "check out",
      pageJs: "checkout",
      addresses: data.addresses,
      user: data.user,
      cart: data.cartTotals,
      availableCoupons: data.availableCoupons,
      appliedCoupon,
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res) => {
  try {
    if(req.session.appliedCoupon)req.session.appliedCoupon=null;
    const result = await applyCouponService(req.body, req.session.user);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    req.session.appliedCoupon = {
      couponId: result.data.couponId,
      discount: result.data.discount,
      finalAmount: result.data.finalAmount,
      code: req.body.code.toUpperCase(),
      couponType:result.data.couponType,
      couponValue:result.data.couponValue,
    };

    return res.status(HttpStatus.OK).json({ success: true });
  } catch (error) {
    console.error("Error on add to cart", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const removeCoupon = (req, res) => {
  req.session.appliedCoupon = null;
  return res.json({
    success: true,
    message: "Coupon removed"
  });
};
