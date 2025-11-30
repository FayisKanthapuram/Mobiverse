import express from "express";
import upload from "../../middlewares/upload.js";
import {
  addProduct,
  editProduct,
  getProductById,
  toggleProduct,
  loadProducts,
  getProducts,
} from "../../controllers/admin/productController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/products", verifyAdmin, loadProducts);
router.post("/products/add", upload.product, addProduct);
router.patch("/products/list/:productId", toggleProduct);
router.get("/api/product/:productId", getProductById);
router.patch("/products/edit/:productId", upload.product, editProduct);

router.get('/products/search',verifyAdmin,getProducts)

export default router;
