import { HttpStatus } from "../../constants/statusCode.js";
import { applyCouponService, loadCheckoutService } from "../../services/checkout.service.js";

export const laodCheckOut = async (req, res, next) => {
  try {
    const data = await loadCheckoutService(req.session.user);

    if (data.hasAdjustedItem) {
      return res.redirect("/cart?message=adjested");
    }

    res.render("user/checkout", {
      pageTitle: "check out",
      pageJs:'checkout',
      addresses: data.addresses,
      user: data.user,
      cart: data.cartTotals,
      availableCoupons: data.availableCoupons,
      appliedCoupon: null,
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res) => {
  try {
    await applyCouponService(req.body)

    return res.status(HttpStatus.OK).json({success:true});
  } catch (error) {
    console.error("Error on add to cart", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
