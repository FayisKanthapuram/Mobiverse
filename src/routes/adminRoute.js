import express from "express";
import setLayout from "../middlewares/setLayout.js";

import orderRoutes from "./admin/orderRoutes.js";
import miscRoutes from "./admin/miscRoutes.js";

import adminAuthRoutes from "../modules/admin-auth/admin.auth.routes.js"
import usersRoutes from "../modules/user-management/user.managment.routes.js"
import couponRoutes from "../modules/coupon/coupon.routes.js";
import brandRoutes from "../modules/brand/brand.routes.js";
import offerRoutes from "../modules/offer/offer.routes.js";
import adminProductRoutes from "../modules/product/routes/admin.product.routes.js";

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
