import express from "express";
import setLayout from "../middlewares/setLayout.js";

import authRoutes from "../../modules/user-auth/auth.routes.js";
import profileRoutes from "../../modules/user/user.routes.js";
import addressRoutes from "../../modules/address/address.routes.js";
import cartRoutes from "../../modules/cart/cart.routes.js";
import checkoutRoutes from "../../modules/checkout/checkout.routes.js";
import orderRoutes from "../../modules/order/routes/user.order.routes.js";
import wishlistRoutes from "../../modules/wishlist/wishlist.routes.js"
import walletRoutes from "../../modules/wallet/wallet.routes.js"

import homeRoutes from "../../modules/home/home.routes.js"
import userProductRoutes from "../../modules/product/routes/user.product.routes.js";

const router = express.Router();

router.use(setLayout("user"));


router.use(homeRoutes);
router.use(userProductRoutes);
router.use(authRoutes);
router.use(profileRoutes);
router.use(addressRoutes);
router.use(orderRoutes);
router.use(walletRoutes);
router.use(wishlistRoutes);
router.use(cartRoutes);
router.use(checkoutRoutes);

export default router;
