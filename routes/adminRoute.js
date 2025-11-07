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
  getBrandById,
  listBrand,
  loadBrands,
} from "../controllers/admin/brandController.js";
import {
  addProduct,
  loadProducts,
} from "../controllers/admin/productController.js";
import { loadCustomers } from "../controllers/admin/customerController.js";
import { loadOrders } from "../controllers/admin/orderController.js";
import { loadCoupons } from "../controllers/admin/couponController.js";
import { loadReferrals } from "../controllers/admin/referralController.js";
import { loadBanners } from "../controllers/admin/bannerController.js";
import { loadOffers } from "../controllers/admin/offerController.js";
import { isLogin, verifyAdmin } from "../middlewares/adminAuth.js";
import upload from "../middlewares/upload.js";

router.use(setLayout("admin"));

//auth
router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

//dash
router.get("/dashboard", verifyAdmin, loadDashboard);

//brands
router.get("/brands", verifyAdmin, loadBrands);
router.post("/brands/add", upload.brand.single("brandLogo"), addBrand);
router.patch("/brands/edit", upload.brand.single("brandLogo"), editBrand);
router.patch("/brands/list/:userId", listBrand);
router.get("/api/brands/:id", verifyAdmin, getBrandById);

//products
router.get("/products", verifyAdmin, loadProducts);
router.post(
  "/products/add",
  upload.product.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
  ]),
  addProduct
);

router.get("/banners", verifyAdmin, loadBanners);
router.get("/customers", verifyAdmin, loadCustomers);
router.get("/orders", verifyAdmin, loadOrders);
router.get("/coupons", verifyAdmin, loadCoupons);
router.get("/referrals", verifyAdmin, loadReferrals);
router.get("/banners", verifyAdmin, loadBanners);
router.get("/offers", verifyAdmin, loadOffers);
router.post("/logout", logoutAdmin);

export default router;
