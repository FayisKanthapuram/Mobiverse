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
  loadOrderFailure,
  retryPayment,
} from "../controllers/user.order.controller.js";
import { deleteTemperoryOrder, verifyRazorpayPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/orders", requireLogin, loadMyOrders);
router.post("/order/place", placeOrder);
router.post("/order/retry-payment/:id",retryPayment);
router.delete('/order/delete/temp-order/:id',deleteTemperoryOrder);
router.get("/order/success/:id", requireLogin, loadOrderSuccess);
router.get("/order/failure/:id",requireLogin,loadOrderFailure);
router.post("/order/:id/cancel-items", cancelOrderItems);
router.post("/order/:id/return-items", returnOrderItems);
router.get("/order/track/:id", requireLogin, loadTrackOrder);
router.get("/order/details/:id", requireLogin, loadOrderDetails);
router.get("/order/invoice/:orderId", requireLogin, downloadInvoice);
router.post("/order/razorpay/verify", requireLogin, verifyRazorpayPayment);

export default router;
