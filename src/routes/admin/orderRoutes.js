import express from "express";
import {
  laodOrderDetails,
  loadOrders,
  updateOrderStatus,
  handleReturnRequest,
  markItemReturned,
} from "../../controllers/admin/orderController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/orders", verifyAdmin, loadOrders);
router.get("/orders/:id", laodOrderDetails);
router.patch("/orders/:id/status", updateOrderStatus);
router.patch("/orders/:id/return-request", handleReturnRequest);
router.patch("/orders/:id/mark-returned", markItemReturned);

export default router;
