import {
  loadOrderSuccessService,
  placeOrderService,
} from "../services/user/user.order.service.js";
import { cancelOrderItemsService, loadInvoiceService, loadMyOrdersService, loadOrderDetailsService, returnOrderItemsService } from "../services/user/myOrders.service.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const body = req.body;

    const appliedCoupon = req.session.appliedCoupon || null;

    const result = await placeOrderService(userId, body, appliedCoupon);
    console.log(result)
    req.session.appliedCoupon = null;

    return res.status(result.status).json(result);
  } catch (err) {
    console.log("Order Error:", err);

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while placing the order.",
    });
  }
};

export const loadOrderSuccess = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderSuccessService(orderId);

    res.status(HttpStatus.OK).render("user/orders/orderSuccess", {
      pageTitle: "Success",
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const loadMyOrders = async (req, res, next) => {
  try {
    const userId = req.session.user;

    const data = await loadMyOrdersService(userId, req.query);

    return res.status(HttpStatus.OK).render("user/orders/myOrders", {
      pageTitle: "My Orders",
      pageJs: "myOrder",
      user: data.user,
      orders: data.orders,
      query: req.query,

      currentPage: data.pagination.currentPage,
      totalDocuments: data.pagination.totalDocuments,
      totalPages: data.pagination.totalPages,
      limit: data.pagination.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderItems = async (req, res) => {
  try {
    const orderId = req.params.id;
    const body = req.body;

    const result = await cancelOrderItemsService(orderId, body);

    return res.status(result.status).json(result);

  } catch (error) {
    console.log("Cancel Order Error:", error);

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while cancelling the order.",
    });
  }
};

export const returnOrderItems = async (req, res) => {
  try {
    const orderId = req.params.id;
    const body = req.body;

    const result = await returnOrderItemsService(orderId, body);

    return res.status(result.status).json(result);

  } catch (error) {
    console.log("Order Error:", error);

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while returning the order.",
    });
  }
};


export const loadTrackOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    return res.status(HttpStatus.OK).render("user/orders/trackOrder", {
      pageTitle: "My Orders",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const loadOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    return res.status(HttpStatus.OK).render("user/orders/orderDetails", {
      pageTitle: "My Orders",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const { order, user } = await loadInvoiceService(orderId);

    // Render invoice HTML (layout: false so it is a clean document)
    return res.status(HttpStatus.OK).render("user/orders/invoice", {
      layout: false,
      order,
      user,
    });
  } catch (error) {
    // service throws a 404-error object when not found, pass to next
    next(error);
  }
};
