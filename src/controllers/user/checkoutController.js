import addressModel from "../../models/addressModel.js";
import userModel from "../../models/userModel.js";
import {
  calculateCartTotals,
  getCartItems,
} from "../../services/cartServices.js";

export const laodCheckOut = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);
    const addresses = await addressModel.find({ userId: req.session.user });

    const items = await getCartItems(req.session.user);
    const cartTotals = await calculateCartTotals(items);

    res.render("user/checkout", {
      pageTitle: "check out",
      addresses,
      user,
      cart: cartTotals,
      availableCoupons: [],
      appliedCoupon: null,
    });
  } catch (error) {
    next(error);
  }
};
