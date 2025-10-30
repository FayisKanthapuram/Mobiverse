import express from "express";
const router = express.Router();
import setLayout from "../middlewares/setLayout.js";

import {
  loadLogin,
  loadDashboard,
  registerAdmin,
  loginAdmin
} from "../controllers/admin/authController.js";
import { loadBrands } from "../controllers/admin/brandController.js";
import { loadProducts } from "../controllers/admin/productController.js";
import { loadCustomers } from "../controllers/admin/customerController.js";
import { loadOrders } from "../controllers/admin/orderController.js";
import { loadCoupons } from "../controllers/admin/couponController.js";
import { loadReferrals } from "../controllers/admin/referralController.js";
import { loadBanners } from "../controllers/admin/bannerController.js";
import { loadOffers } from "../controllers/admin/offerController.js";

router.use(setLayout("admin"));
router.get("/login", loadLogin);
router.post("/register", registerAdmin);
router.post('/login',loginAdmin);
router.get("/dashboard", loadDashboard);
router.get("/banners", loadBanners);
router.get("/brands", loadBrands);
router.get("/products", loadProducts);
router.get("/customers", loadCustomers);
router.get("/orders", loadOrders);
router.get("/coupons", loadCoupons);
router.get("/referrals", loadReferrals);
router.get("/banners", loadBanners);
router.get("/offers", loadOffers);

export default router;
