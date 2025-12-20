import express from "express";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";
import {loadDashboard} from "./dashboard.controller.js"

const router = express.Router();

router.get("/", verifyAdmin, loadDashboard);

export default router;
