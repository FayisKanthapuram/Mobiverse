import {
  loadOrderSuccessService,
  placeOrderService,
} from "../../services/order.service.js";

export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const body = req.body;

    const result = await placeOrderService(userId, body);

    return res.status(result.status).json(result);
  } catch (err) {
    console.log("Order Error:", err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while placing the order.",
    });
  }
};

export const loadOrderSuccess = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderSuccessService(orderId);

    res.render("user/orderSuccess", {
      pageTitle: "Success",
      order,
    });
  } catch (error) {
    next(error);
  }
};
