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

router.get("/", verifyAdmin, loadProducts);
router.post("/add", upload.product, addProduct);
router.get('/search',verifyAdmin,getProducts)
router.patch("/list/:productId", toggleProduct);
router.patch("/edit/:productId", upload.product, editProduct);
router.get("/:productId", getProductById);


export default router;
