import express from "express";
import { loadReferrals } from "./referral.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadReferrals);

export default router;
