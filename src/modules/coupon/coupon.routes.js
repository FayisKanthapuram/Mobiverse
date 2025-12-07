import express from "express";

import { addCoupon, deleteCoupon, editCoupon, getCoupon, loadCoupons, toggleCouponStatus } from "../../controllers/admin/coupon.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/coupons", verifyAdmin, loadCoupons);
router.post('/coupons',verifyAdmin,addCoupon);
router.get('/coupons/:id',verifyAdmin,getCoupon);
router.put('/coupons/:id',verifyAdmin,editCoupon);
router.patch('/coupons/:id/toggle-status',verifyAdmin,toggleCouponStatus);
router.delete('/coupons/:id',verifyAdmin,deleteCoupon);

export default router;