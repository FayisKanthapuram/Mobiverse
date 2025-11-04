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
import {
  addBrand,
  editBrand,
  listBrand,
  loadBrands,
} from "../controllers/admin/brandController.js";
import { loadProducts } from "../controllers/admin/productController.js";
import { loadCustomers } from "../controllers/admin/customerController.js";
import { loadOrders } from "../controllers/admin/orderController.js";
import { loadCoupons } from "../controllers/admin/couponController.js";
import { loadReferrals } from "../controllers/admin/referralController.js";
import { loadBanners } from "../controllers/admin/bannerController.js";
import { loadOffers } from "../controllers/admin/offerController.js";
import { isLogin, requireLogin } from "../middlewares/adminAuth.js";
import upload from "../middlewares/upload.js";

router.use(setLayout("admin"));

//auth
router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

//dash
router.get("/dashboard", requireLogin, loadDashboard);

//brands
router.get("/brands", requireLogin, loadBrands);
router.post("/brands/add", upload.single("brandLogo"), addBrand);
router.patch("/brands/edit", upload.single("brandLogo"), editBrand);
router.patch("/brands/list/:userId", listBrand);

router.get("/banners", requireLogin, loadBanners);
router.get("/products", requireLogin, loadProducts);
router.get("/customers", requireLogin, loadCustomers);
router.get("/orders", requireLogin, loadOrders);
router.get("/coupons", requireLogin, loadCoupons);
router.get("/referrals", requireLogin, loadReferrals);
router.get("/banners", requireLogin, loadBanners);
router.get("/offers", requireLogin, loadOffers);
router.post("/logout", logoutAdmin);

export default router;
