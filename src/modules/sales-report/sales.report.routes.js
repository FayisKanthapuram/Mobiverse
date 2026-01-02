import express from "express";
import { loadSalesReport, loadSalesReportDownload, loadSalesReportPDF } from "./sales.report.controller.js";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";

// Sales report routes - admin endpoints
const router = express.Router();

// Render sales report page
router.get("/", verifyAdmin, loadSalesReport);

// Download sales report as Excel
router.get("/excel", verifyAdmin, loadSalesReportDownload);

// Download sales report as PDF
router.get("/pdf", verifyAdmin, loadSalesReportPDF);

export default router;
