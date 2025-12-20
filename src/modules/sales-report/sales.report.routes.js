import express from "express";
import {  loadSalesReport, loadSalesReportDownload, loadSalesReportPDF } from "./sales.report.controller.js";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadSalesReport);
router.get("/excel", verifyAdmin, loadSalesReportDownload);
router.get("/pdf", verifyAdmin, loadSalesReportPDF);



export default router;
