import express from "express";
import setLayout from "../middlewares/setLayout.js";

import authRoutes from "./admin/authRoutes.js";
import brandRoutes from "./admin/brandRoutes.js";
import productRoutes from "./admin/productRoutes.js";
import customerRoutes from "./admin/customerRoutes.js";
import orderRoutes from "./admin/orderRoutes.js";
import offerRoutes from "./admin/offerRoutes.js";
import miscRoutes from "./admin/miscRoutes.js";

const router = express.Router();

router.use(setLayout("admin"));

router.use(authRoutes);
router.use(brandRoutes);
router.use(productRoutes);
router.use(customerRoutes);
router.use(orderRoutes);
router.use(offerRoutes);
router.use(miscRoutes);


export default router;
