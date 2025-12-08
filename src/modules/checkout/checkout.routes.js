import express from "express";
import { applyCoupon, laodCheckOut, removeCoupon } from "./checkout.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

router.get("/checkout", requireLogin, laodCheckOut);
router.post('/checkout/apply-coupon',requireLogin,applyCoupon);
router.post('/checkout/remove-coupon',requireLogin,removeCoupon);

export default router;
