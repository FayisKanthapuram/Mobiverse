import express from "express";
import { loadReferrals } from "../controllers/admin.referral.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

// Referral routes (admin)
const router = express.Router();

// Render admin referrals page
router.get("/", verifyAdmin, loadReferrals);

export default router;
