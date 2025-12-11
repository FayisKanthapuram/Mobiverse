import express from "express";
import { loadReferrals } from "../controllers/admin.referral.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadReferrals);

export default router;
