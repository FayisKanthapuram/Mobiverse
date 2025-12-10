import express from "express";
import { requireLogin } from "../../shared/middlewares/userAuth.js";
import { addMoney, loadMyWallet, verifyPayment } from "./wallet.controller.js";

const router = express.Router();

router.get('/wallet',requireLogin,loadMyWallet);
router.post('/wallet/add-money',addMoney);
router.post("/wallet/verify-payment", verifyPayment);


export default router;
