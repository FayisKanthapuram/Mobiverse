import express from "express";
import {
  loadOrderDetails,
  loadOrders,
  handleReturnRequest,
  markItemReturned,
  updateItemStatus,
} from "../controllers/admin.order.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadOrders);
router.get("/details/:orderId",verifyAdmin, loadOrderDetails);
router.patch("/:orderId/items/:itemId/status", verifyAdmin, updateItemStatus);
router.patch("/:id/return-request",verifyAdmin, handleReturnRequest);
router.patch("/:id/mark-returned",verifyAdmin, markItemReturned);

export default router;
