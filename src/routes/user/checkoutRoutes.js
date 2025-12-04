import express from "express";
import { applyCoupon, laodCheckOut } from "../../controllers/user/checkout.controller.js";
import { requireLogin } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/checkout", requireLogin, laodCheckOut);
router.post('/checkout/apply-coupon',requireLogin,applyCoupon);

export default router;
