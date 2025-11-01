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
import { isLogin, requireLogin } from "../middlewares/adminAuth.js";

router.use(setLayout("admin"));
router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/dashboard", requireLogin, loadDashboard);
router.get("/banners", requireLogin, loadBanners);
router.get("/brands", requireLogin, loadBrands);
router.get("/products", requireLogin, loadProducts);
router.get("/customers", requireLogin, loadCustomers);
router.get("/orders", requireLogin, loadOrders);
router.get("/coupons", requireLogin, loadCoupons);
router.get("/referrals", requireLogin, loadReferrals);
router.get("/banners", requireLogin, loadBanners);
router.get("/offers", requireLogin, loadOffers);
router.post('/logout',logoutAdmin)

export default router;
