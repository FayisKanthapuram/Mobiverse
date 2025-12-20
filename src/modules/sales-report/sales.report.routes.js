import express from "express";
import {  loadSalesReport, loadSalesReportDownload, loadSalesReportPDF } from "./sales.report.controller.js";

const router = express.Router();

router.get("/", loadSalesReport);
router.get("/excel", loadSalesReportDownload);
router.get("/pdf", loadSalesReportPDF);



export default router;
