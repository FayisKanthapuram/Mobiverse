import express from "express";
import {
  cancelOrderItems,
  downloadInvoice,
  laodMyOrders,
  loadOrderDetails,
  loadOrderSuccess,
  loadTrackOrder,
  placeOrder,
  returnOrderItems,
} from "../../controllers/user/orderController.js";
import { requireLogin } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/orders", requireLogin, laodMyOrders);
router.post("/order/place", placeOrder);
router.get("/order/success/:id", requireLogin, loadOrderSuccess);
router.post("/order/:id/cancel-items", cancelOrderItems);
router.post("/order/:id/return-items", returnOrderItems);
router.get("/order/track/:id", requireLogin, loadTrackOrder);
router.get("/order/details/:id", requireLogin, loadOrderDetails);
router.get("/order/invoice/:orderId", requireLogin, downloadInvoice);

export default router;
