import express from "express";
import { requireLogin } from "../../../shared/middlewares/userAuth.js";
import {
  loadOrderSuccess,
  placeOrder,
  cancelOrderItems,
  downloadInvoice,
  loadMyOrders,
  loadOrderDetails,
  returnOrderItems,
  loadOrderFailure,
  retryPayment,
} from "../controllers/user.order.controller.js";
import {
  abandonPendingPayment,
  markRazorpayPaymentFailed,
  verifyRazorpayPayment,
} from "../controllers/payment.controller.js";

// User order routes
const router = express.Router();

// Get user orders
router.get("/orders", requireLogin, loadMyOrders);
// Place new order
router.post("/order/place", requireLogin, placeOrder);
// Retry payment for order
router.post("/order/retry-payment/:orderId", requireLogin, retryPayment);
// Delete abandon pending payment
router.post(
  "/order/abandon-pending-payment",
  requireLogin,
  abandonPendingPayment
);
// Load order success page
router.get("/order/success/:orderId", requireLogin, loadOrderSuccess);
// Load order failure page
router.get("/order/failure/:orderId", requireLogin, loadOrderFailure);
router.post("/order/razorpay/failed", requireLogin, markRazorpayPaymentFailed);
// Cancel selected items
router.post("/order/:orderId/cancel-items", requireLogin, cancelOrderItems);
// Request return for items
router.post("/order/:orderId/return-items", requireLogin, returnOrderItems);
// Get order details
router.get("/order/details/:orderId", requireLogin, loadOrderDetails);
// Download invoice
router.get("/order/invoice/:orderId", requireLogin, downloadInvoice);
// Verify Razorpay payment
router.post("/order/razorpay/verify", requireLogin, verifyRazorpayPayment);

export default router;
