import express from "express";

import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";
import {
  createBanner,
  deleteBanner,
  getCreateForm,
  getEditForm,
  loadBanners,
  reorderBanners,
  toggleBannerStatus,
  updateBanner,
} from "./banners.controller.js";
import upload from "../../shared/middlewares/upload.js";

const router = express.Router();

// Banners routes - admin endpoints for banner management

router.get("/", verifyAdmin, loadBanners);
router.get("/create", verifyAdmin, getCreateForm);
router.get("/edit/:id", verifyAdmin, getEditForm);

router.post("/", verifyAdmin, upload.banner, createBanner);
router.put("/:id", verifyAdmin, upload.banner, updateBanner);
router.patch("/:id/toggle", verifyAdmin, toggleBannerStatus);
router.post("/reorder", verifyAdmin, reorderBanners);
router.delete("/:id", verifyAdmin, deleteBanner);

export default router;
