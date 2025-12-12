import express from "express";
import { requireLogin } from "../../../shared/middlewares/userAuth.js";
import {
  loadOrderSuccess,
  placeOrder,
  cancelOrderItems,
  downloadInvoice,
  loadMyOrders,
  loadOrderDetails,
  loadTrackOrder,
  returnOrderItems,
} from "../controllers/user.order.controller.js";
import { verifyRazorpayPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/orders", requireLogin, loadMyOrders);
router.post("/order/place", placeOrder);
router.get("/order/success/:id", requireLogin, loadOrderSuccess);
router.post("/order/:id/cancel-items", cancelOrderItems);
router.post("/order/:id/return-items", returnOrderItems);
router.get("/order/track/:id", requireLogin, loadTrackOrder);
router.get("/order/details/:id", requireLogin, loadOrderDetails);
router.get("/order/invoice/:orderId", requireLogin, downloadInvoice);
router.post("/order/razorpay/verify", requireLogin, verifyRazorpayPayment);

export default router;
