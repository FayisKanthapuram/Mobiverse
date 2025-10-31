import express from "express";
const router = express.Router();
import setLayout from "../middlewares/setLayout.js";

import {
  loadLogin,
  loadDashboard,
  registerAdmin,
  loginAdmin,
  logoutAdmin,
} from "../controllers/admin/authController.js";
import { loadBrands } from "../controllers/admin/brandController.js";
import { loadProducts } from "../controllers/admin/productController.js";
import { loadCustomers } from "../controllers/admin/customerController.js";
import { loadOrders } from "../controllers/admin/orderController.js";
import { loadCoupons } from "../controllers/admin/couponController.js";
import { loadReferrals } from "../controllers/admin/referralController.js";
import { loadBanners } from "../controllers/admin/bannerController.js";
import { loadOffers } from "../controllers/admin/offerController.js";
import { isLogin, checkSession } from "../middlewares/adminAuth.js";

router.use(setLayout("admin"));
router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/dashboard", checkSession, loadDashboard);
router.get("/banners", checkSession, loadBanners);
router.get("/brands", checkSession, loadBrands);
router.get("/products", checkSession, loadProducts);
router.get("/customers", checkSession, loadCustomers);
router.get("/orders", checkSession, loadOrders);
router.get("/coupons", checkSession, loadCoupons);
router.get("/referrals", checkSession, loadReferrals);
router.get("/banners", checkSession, loadBanners);
router.get("/offers", checkSession, loadOffers);
router.post('/logout',logoutAdmin)

export default router;
