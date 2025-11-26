import express from "express";
import upload from "../../middlewares/upload.js";
import {
  addBrand,
  editBrand,
  getBrandById,
  listBrand,
  loadBrands,
} from "../../controllers/admin/brandController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/brands", verifyAdmin, loadBrands);
router.post("/brands/add", upload.brand.single("brandLogo"), addBrand);
router.patch("/brands/edit", upload.brand.single("brandLogo"), editBrand);
router.patch("/brands/list/:brandId", listBrand);
router.get("/api/brands/:id", verifyAdmin, getBrandById);

export default router;
