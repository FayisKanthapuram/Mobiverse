import express from "express";
import setLayout from "../middlewares/setLayout.js";

import authRoutes from "./admin/authRoutes.js";
import orderRoutes from "./admin/orderRoutes.js";
import miscRoutes from "./admin/miscRoutes.js";

const router = express.Router();

router.use(setLayout("admin"));

router.use(authRoutes);
router.use(orderRoutes);
router.use(miscRoutes);


export default router;
