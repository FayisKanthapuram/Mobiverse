import express from "express";

import { addCoupon, deleteCoupon, editCoupon, getCoupon, loadCoupons, searchUser, toggleCouponStatus } from "./coupon.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/coupons", verifyAdmin, loadCoupons);
router.post('/coupons',verifyAdmin,addCoupon);
router.get('/coupons/:id',verifyAdmin,getCoupon);
router.put('/coupons/:id',verifyAdmin,editCoupon);
router.patch('/coupons/:id/toggle-status',verifyAdmin,toggleCouponStatus);
router.delete('/coupons/:id',verifyAdmin,deleteCoupon);
router.get("/users/search",verifyAdmin,searchUser);

export default router;