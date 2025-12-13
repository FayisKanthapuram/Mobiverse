import express from "express";
import { loadSalesReport } from "./sales.report.controller.js";

const router = express.Router();

router.get("/", loadSalesReport);


export default router;
