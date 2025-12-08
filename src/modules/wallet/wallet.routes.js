import express from "express";
import { requireLogin } from "../../middlewares/userAuth.js";
import { loadMyWallet } from "./wallet.controller.js";

const router = express.Router();

router.get('/wallet',requireLogin,loadMyWallet);



export default router;
