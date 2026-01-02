import express from "express";
import {
  loadShop,
  loadProductDetails,
} from "../controllers/user.product.controller.js";

const router = express.Router();

// User product routes
// Shop page
router.get("/shop", loadShop);
// Products listing (alias for shop)
router.get("/products", loadShop);
// Product details by variant
router.get("/products/:variantId", loadProductDetails);

export default router;
