import express from "express";
import {
  loadOrderDetails,
  loadOrders,
  updateOrderStatus,
  handleReturnRequest,
  markItemReturned,
} from "../../controllers/admin/order.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/orders", verifyAdmin, loadOrders);
router.get("/orders/:id", loadOrderDetails);
router.patch("/orders/:id/status", updateOrderStatus);
router.patch("/orders/:id/return-request", handleReturnRequest);
router.patch("/orders/:id/mark-returned", markItemReturned);

export default router;
