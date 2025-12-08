import express from "express";
import upload from "../../shared/middlewares/upload.js";
import {
  addBrand,
  editBrand,
  getBrandById,
  listBrand,
  loadBrands,
} from "./brand.controller.js";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";

const router = express.Router();

router.get("/", verifyAdmin, loadBrands);
router.post("/add", upload.brand, addBrand);
router.patch("/edit", upload.brand, editBrand);
router.patch("/list/:brandId", listBrand);
router.get("/:id", verifyAdmin, getBrandById);

export default router;
