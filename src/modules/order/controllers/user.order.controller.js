import {
  loadOrderFailureService,
  loadOrderSuccessService,
  placeOrderService,
  retryPaymentService,
} from "../services/user/user.order.service.js";
import {
  cancelOrderItemsService,
  loadInvoiceService,
  loadMyOrdersService,
  loadOrderDetailsService,
  returnOrderItemsService,
} from "../services/user/myOrders.service.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

// User order controller - handle user order endpoints
// Place an order
export const placeOrder = async (req, res) => {
  const userId = req.user._id;
  const appliedCoupon = req.session.appliedCoupon || null;

  const result = await placeOrderService(userId, req.body, appliedCoupon);
  req.session.cartCount=0;

  if (req.body.paymentMethod !== "razorpay") {
    req.session.appliedCoupon = null;
  }

  res.status(result.status).json(result);
};

// Retry payment for an order
export const retryPayment = async (req, res) => {
  const result = await retryPaymentService(req.params.orderId,req.user._id);
  res.status(result.status).json(result);
};

// Render order success page
export const loadOrderSuccess = async (req, res) => {
  const order = await loadOrderSuccessService(req.params.orderId, req.user._id);

  res.status(HttpStatus.OK).render("user/orders/orderSuccess", {
    pageTitle: "Success",
    order,
  });
};

// Render order failure page
export const loadOrderFailure = async (req, res) => {
  const order = await loadOrderFailureService(req.params.orderId, req.user._id);

  res.status(HttpStatus.OK).render("user/orders/orderFailed", {
    pageTitle: "Order Failed",
    pageJs:'orderFailed',
    order,
  });
};

// Render my orders page
export const loadMyOrders = async (req, res) => {
  const data = await loadMyOrdersService(req.user, req.query);

  res.status(HttpStatus.OK).render("user/orders/myOrders", {
    pageTitle: "My Orders",
    pageJs: "myOrder",
    user: data.user,
    orders: data.orders,
    query: req.query,
    ...data.pagination,
  });
};

// Cancel items in an order
export const cancelOrderItems = async (req, res) => {
  const result = await cancelOrderItemsService(
    req.params.orderId,
    req.body,
    req.user._id
  );
  res.status(result.status).json(result);
};

// Return items from an order
export const returnOrderItems = async (req, res) => {
  const result = await returnOrderItemsService(
    req.params.orderId,
    req.body,
    req.user._id
  );
  res.status(result.status).json(result);
};

// Render order details page
export const loadOrderDetails = async (req, res) => {
  const order = await loadOrderDetailsService(req.params.orderId,req.user._id);

  res.status(HttpStatus.OK).render("user/orders/orderDetails", {
    pageTitle: "Order Details",
    order,
  });
};

// Download invoice PDF
export const downloadInvoice = async (req, res) => {
  const { order, user } = await loadInvoiceService(
    req.params.orderId,
    req.user._id
  );

  res.status(HttpStatus.OK).render("user/orders/invoice", {
    layout: false,
    order,
    user,
  });
};
