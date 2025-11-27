import express from "express";
import { loadCoupons } from "../../controllers/admin/couponController.js";
import { loadReferrals } from "../../controllers/admin/referralController.js";
import { loadBanners } from "../../controllers/admin/bannerController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/banners", verifyAdmin, loadBanners);
router.get("/coupons", verifyAdmin, loadCoupons);
router.get("/referrals", verifyAdmin, loadReferrals);

export default router;
