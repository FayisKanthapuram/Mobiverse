import express from "express";

import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";
import { loadBanners } from "./banner.controller.js";

const router = express.Router();

router.get("/", verifyAdmin, loadBanners);


export default router;
