import express from "express";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";
import * as controller from "./dashboard.controller.js";

const router = express.Router();

router.get("/", verifyAdmin, controller.loadDashboard);
router.get("/api/stats", verifyAdmin, controller.getStats);
router.get("/api/sales-chart", verifyAdmin, controller.getSalesChart);
router.get("/api/order-status", verifyAdmin, controller.getOrderStatus);
router.get("/api/top-products", verifyAdmin, controller.getTopProducts);
router.get("/api/top-brands", verifyAdmin, controller.getTopBrands);
router.get("/api/recent-orders", verifyAdmin, controller.getRecentOrders);

export default router;
