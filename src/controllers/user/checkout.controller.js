import { loadCheckoutService } from "../../services/checkout.service.js";


export const laodCheckOut = async (req, res, next) => {
  try {
    const data = await loadCheckoutService(req.session.user);

    res.render("user/checkout", {
      pageTitle: "check out",
      addresses:data.addresses,
      user:data.user,
      cart: data.cartTotals,
      availableCoupons: [],
      appliedCoupon: null,
    });
  } catch (error) {
    next(error);
  }
};