import express from "express";
import setLayout from "../middlewares/setLayout.js";

import authRoutes from "./user/authRoutes.js";
import profileRoutes from "./user/profileRoutes.js";
import addressRoutes from "./user/addressRoutes.js";
import cartRoutes from "./user/cartRoutes.js";
import checkoutRoutes from "./user/checkoutRoutes.js";
import orderRoutes from "./user/orderRoutes.js";
import wishlistRoutes from "./user/wishlistRoutes.js"
import walletRoutes from "./user/walletRoutes.js"

const router = express.Router();

router.use(setLayout("user"));

// mount modular user routes
router.use(authRoutes);
router.use(profileRoutes);
router.use(addressRoutes);
router.use(orderRoutes);
router.use(walletRoutes);
router.use(wishlistRoutes);
router.use(cartRoutes);
router.use(checkoutRoutes);

export default router;
