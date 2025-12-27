import express from "express";
import {
  addToCart,
  deleteCartItem,
  loadCart,
  updateCartItem,
} from "./cart.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

router.get("/cart", requireLogin, loadCart);
router.post("/cart/add", addToCart);
router.patch("/cart/update/:id",requireLogin, updateCartItem);
router.delete("/cart/remove/:id",requireLogin, deleteCartItem);

export default router;
