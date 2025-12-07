import express from "express";

import { addCoupon, deleteCoupon, editCoupon, getCoupon, loadCoupons, toggleCouponStatus } from "./coupon.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadCoupons);
router.post('/',verifyAdmin,addCoupon);
router.get('/:id',verifyAdmin,getCoupon);
router.put('/:id',verifyAdmin,editCoupon);
router.patch('/:id/toggle-status',verifyAdmin,toggleCouponStatus);
router.delete('/:id',verifyAdmin,deleteCoupon);


export default router;