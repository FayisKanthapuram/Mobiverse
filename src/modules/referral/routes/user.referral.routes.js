import express from "express";
import { requireLogin } from "../../../shared/middlewares/userAuth.js";
import { laodRefferAndEarn } from "../controllers/user.referral.controller.js";

// Referral routes (user)
const router = express.Router();

// Render refer & earn page for logged-in users
router.get("/refer-earn", requireLogin, laodRefferAndEarn);

export default router;