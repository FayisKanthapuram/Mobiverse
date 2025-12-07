import express from "express";
import {
  loadShop,
  loadProductDetails,
} from "../controllers/user.product.controller.js";

const router = express.Router();

router.get("/", loadShop);
router.get("/:variantId", loadProductDetails);

export default router;
