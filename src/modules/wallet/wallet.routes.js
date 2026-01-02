import express from "express";
import { requireLogin } from "../../shared/middlewares/userAuth.js";
import { addMoney, loadMyWallet, verifyPayment } from "./wallet.controller.js";

// Wallet routes - user wallet endpoints
const router = express.Router();

// Render wallet page
router.get("/wallet", requireLogin, loadMyWallet);

// Create top-up order
router.post("/wallet/add-money", requireLogin, addMoney);

// Verify payment callback
router.post("/wallet/verify-payment", verifyPayment);

export default router;
