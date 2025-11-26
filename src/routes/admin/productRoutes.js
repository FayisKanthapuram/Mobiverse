import express from "express";
import upload from "../../middlewares/upload.js";
import {
  addProduct,
  editProduct,
  getProductById,
  listProduct,
  loadProducts,
} from "../../controllers/admin/productController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/products", verifyAdmin, loadProducts);
router.post("/products/add", upload.product.any(), addProduct);
router.patch("/products/list/:productId", listProduct);
router.get("/api/product/:productId", getProductById);
router.patch("/products/edit/:productId", upload.product.any(), editProduct);

export default router;
