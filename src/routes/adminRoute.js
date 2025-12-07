import express from "express";
import setLayout from "../middlewares/setLayout.js";

import orderRoutes from "./admin/orderRoutes.js";
import miscRoutes from "./admin/miscRoutes.js";

import adminAuthRoutes from "../modules/admin/auth/admin.auth.routes.js"
import usersRoutes from "../modules/admin/user/user.routes.js"
import couponRoutes from "../modules/admin/coupon/coupon.routes.js";
import brandRoutes from "../modules/admin/brand/brand.routes.js";
import offerRoutes from "../modules/admin/offer/offer.routes.js";
import adminProductRoutes from "../modules/admin/product/product.routes.js";

const router = express.Router();

router.use(setLayout("admin"));

router.use('/',adminAuthRoutes);
router.use('/users',usersRoutes)
router.use("/coupons", couponRoutes);
router.use("/brands", brandRoutes);
router.use("/offers", offerRoutes);
router.use("/products", adminProductRoutes);

router.use(orderRoutes);
router.use(miscRoutes);


export default router;
