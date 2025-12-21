import express from "express";

import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";
import { createBanner, getCreateForm, getEditForm, loadBanners } from "./banners.controller.js";
import upload from "../../shared/middlewares/upload.js";

const router = express.Router();

router.get("/", verifyAdmin, loadBanners);
router.get("/create", verifyAdmin, getCreateForm);
router.get("/edit/:id", verifyAdmin, getEditForm);

router.post("/", verifyAdmin, upload.banner, createBanner);


export default router;
