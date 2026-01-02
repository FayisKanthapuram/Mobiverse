import express from "express";
import upload from "../../../shared/middlewares/upload.js";
import {
  addProduct,
  editProduct,
  getProductById,
  toggleProduct,
  loadProducts,
  getProducts,
} from "../controllers/admin.product.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/adminAuth.js";

const router = express.Router();

// Admin product routes
// List products
router.get("/", verifyAdmin, loadProducts);
// Add product with uploaded images
router.post("/add", upload.product, addProduct);
// Search products
router.get('/search',verifyAdmin,getProducts)
// Toggle product listed status
router.patch("/list/:productId", toggleProduct);
// Edit product details
router.patch("/edit/:productId", upload.product, editProduct);
// Get product by ID
router.get("/:productId", getProductById);

export default router;
