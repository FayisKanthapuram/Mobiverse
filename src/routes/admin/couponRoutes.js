import express from "express";

import { addCoupon, editCoupon, loadCoupons } from "../../controllers/admin/coupon.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/coupons", verifyAdmin, loadCoupons);
router.post('/coupons',verifyAdmin,addCoupon);
router.put('/coupons/:id',verifyAdmin,editCoupon);

export default router;