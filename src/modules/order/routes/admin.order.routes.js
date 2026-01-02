import express from "express";
import {
  loadOrderDetails,
  loadOrders,
  handleReturnRequest,
  markItemReturned,
  updateItemStatus,
} from "../controllers/admin.order.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

// Admin order routes
const router = express.Router();

// Get all orders
// Get all orders
router.get("/", verifyAdmin, loadOrders);
// Get order details
router.get("/details/:orderId",verifyAdmin, loadOrderDetails);
// Update item status
router.patch("/:orderId/items/:itemId/status", verifyAdmin, updateItemStatus);
// Handle return request
router.patch("/:id/return-request",verifyAdmin, handleReturnRequest);
// Mark item as returned
router.patch("/:id/mark-returned",verifyAdmin, markItemReturned);

export default router;
