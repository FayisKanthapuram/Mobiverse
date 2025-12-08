import express from "express";
import {
  loadOrderDetails,
  loadOrders,
  updateOrderStatus,
  handleReturnRequest,
  markItemReturned,
} from "../controllers/admin.order.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadOrders);
router.get("/:id", loadOrderDetails);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/return-request", handleReturnRequest);
router.patch("/:id/mark-returned", markItemReturned);

export default router;
