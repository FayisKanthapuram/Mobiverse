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
import { deleteTemperoryOrder, verifyRazorpayPayment } from "../controllers/payment.controller.js";

// User order routes
const router = express.Router();

// Get user orders
// Get user orders
router.get("/orders", requireLogin, loadMyOrders);
// Place new order
router.post("/order/place", requireLogin, placeOrder);
// Retry payment for order
router.post("/order/retry-payment/:id", requireLogin, retryPayment);
// Delete temporary order
router.delete(
  "/order/delete/temp-order/:id",
  requireLogin,
  deleteTemperoryOrder
);
// Load order success page
router.get("/order/success/:id", requireLogin, loadOrderSuccess);
// Load order failure page
router.get("/order/failure/:id",requireLogin,loadOrderFailure);
// Cancel selected items
router.post("/order/:id/cancel-items",requireLogin, cancelOrderItems);
// Request return for items
router.post("/order/:id/return-items", requireLogin, returnOrderItems);
// Get order details
router.get("/order/details/:id", requireLogin, loadOrderDetails);
// Download invoice
router.get("/order/invoice/:id", requireLogin, downloadInvoice);
// Verify Razorpay payment
router.post("/order/razorpay/verify", requireLogin, verifyRazorpayPayment);

export default router;
