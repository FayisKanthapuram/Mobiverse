import express from "express";
import setLayout from "../middlewares/setLayout.js";

import orderRoutes from "../../modules/order/routes/admin.order.routes.js";
import referralRoutes from "../../modules/referral/routes/admin.referral.routes.js";

import adminAuthRoutes from "../../modules/admin-auth/admin.auth.routes.js"
import usersRoutes from "../../modules/user-management/user.managment.routes.js"
import couponRoutes from "../../modules/coupon/coupon.routes.js";
import brandRoutes from "../../modules/brand/brand.routes.js";
import offerRoutes from "../../modules/offer/offer.routes.js";
import adminProductRoutes from "../../modules/product/routes/admin.product.routes.js";
import bannerRoutes from "../../modules/banner/banner.routes.js"
import salesRoutes from "../../modules/sales report/sales.report.routes.js"

const router = express.Router();

router.use(setLayout("admin"));

router.use(adminAuthRoutes);

router.use('/users',usersRoutes)
router.use("/coupons", couponRoutes);
router.use("/sales-report",salesRoutes);
router.use("/brands", brandRoutes);
router.use("/offers", offerRoutes);
router.use("/products", adminProductRoutes);
router.use('/orders',orderRoutes);
router.use('/banners',bannerRoutes);
router.use('/referrals',referralRoutes);


export default router;
