import express from "express";
import {
  applyCoupon,
  loadCheckOut,
  removeCoupon,
} from "./checkout.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

// Checkout routes - user checkout endpoints
router.get("/checkout", requireLogin, loadCheckOut);
router.post('/checkout/apply-coupon',requireLogin,applyCoupon);
router.post('/checkout/remove-coupon',requireLogin,removeCoupon);

export default router;
