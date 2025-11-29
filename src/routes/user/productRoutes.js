import express from "express";
import {
  loadShop,
  loadHome,
  loadProductDetails,
} from "../../controllers/user/user.controller.js";

const router = express.Router();

router.get("/home", loadHome);
router.get("/shop", loadShop);
router.get("/product/:variantId", loadProductDetails);

export default router;
