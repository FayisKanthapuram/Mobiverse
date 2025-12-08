import express from "express";
import {
  loadShop,
  loadProductDetails,
} from "../controllers/user.product.controller.js";

const router = express.Router();

router.get("/shop", loadShop);
router.get("/products", loadShop);
router.get("/products/:variantId", loadProductDetails);

export default router;
