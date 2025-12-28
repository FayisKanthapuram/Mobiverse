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

/* ----------------------------------------------------
   PLACE ORDER
---------------------------------------------------- */
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

/* ----------------------------------------------------
   RETRY PAYMENT
---------------------------------------------------- */
export const retryPayment = async (req, res) => {
  const result = await retryPaymentService(req.params.id);
  res.status(result.status).json(result);
};

/* ----------------------------------------------------
   ORDER SUCCESS / FAILURE
---------------------------------------------------- */
export const loadOrderSuccess = async (req, res) => {
  const order = await loadOrderSuccessService(req.params.id);

  res.status(HttpStatus.OK).render("user/orders/orderSuccess", {
    pageTitle: "Success",
    order,
  });
};

export const loadOrderFailure = async (req, res) => {
  const order = await loadOrderFailureService(req.params.id);

  res.status(HttpStatus.OK).render("user/orders/orderFailed", {
    pageTitle: "Order Failed",
    pageJs:'orderFailed',
    order,
  });
};

/* ----------------------------------------------------
   MY ORDERS
---------------------------------------------------- */
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

/* ----------------------------------------------------
   CANCEL / RETURN ITEMS
---------------------------------------------------- */
export const cancelOrderItems = async (req, res) => {
  const result = await cancelOrderItemsService(req.params.id, req.body);
  res.status(result.status).json(result);
};

export const returnOrderItems = async (req, res) => {
  const result = await returnOrderItemsService(req.params.id, req.body);
  res.status(result.status).json(result);
};


export const loadOrderDetails = async (req, res) => {
  const order = await loadOrderDetailsService(req.params.id);

  res.status(HttpStatus.OK).render("user/orders/orderDetails", {
    pageTitle: "Order Details",
    order,
  });
};

export const downloadInvoice = async (req, res) => {
  const { order, user } = await loadInvoiceService(req.params.id);

  res.status(HttpStatus.OK).render("user/orders/invoice", {
    layout: false,
    order,
    user,
  });
};
