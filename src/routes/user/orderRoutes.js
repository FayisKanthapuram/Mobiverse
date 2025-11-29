import express from "express";
import {
  loadOrderSuccess,
  placeOrder,
} from "../../controllers/user/order.controller.js";
import { requireLogin } from "../../middlewares/userAuth.js";
import { cancelOrderItems, downloadInvoice, loadMyOrders, loadOrderDetails, loadTrackOrder, returnOrderItems } from "../../controllers/user/myOrder.controller.js";

const router = express.Router();

router.get("/orders", requireLogin, loadMyOrders);
router.post("/order/place", placeOrder);
router.get("/order/success/:id", requireLogin, loadOrderSuccess);
router.post("/order/:id/cancel-items", cancelOrderItems);
router.post("/order/:id/return-items", returnOrderItems);
router.get("/order/track/:id", requireLogin, loadTrackOrder);
router.get("/order/details/:id", requireLogin, loadOrderDetails);
router.get("/order/invoice/:orderId", requireLogin, downloadInvoice);

export default router;
