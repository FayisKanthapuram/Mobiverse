import express from "express";
import {  loadSalesReport, loadSalesReportDownload, loadSalesReportPDF } from "./sales.report.controller.js";

const router = express.Router();

router.get("/", loadSalesReport);
router.get("/download", loadSalesReportDownload);
router.get("/pdf", loadSalesReportPDF);



export default router;
