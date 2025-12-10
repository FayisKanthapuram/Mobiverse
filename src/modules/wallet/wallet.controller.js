import {
  addMoneyService,
  loadMyWalletService,
  verifyPaymentService,
} from "./wallet.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
export const loadMyWallet = async (req, res) => {
  try {
    const { user, wallet } = await loadMyWalletService(req.session.user);
    res.status(HttpStatus.OK).render("user/wallet", {
      key: process.env.RAZORPAY_KEY_ID,
      pageTitle: "My Wallet",
      pageJs: "wallet",
      wallet,
      query: {},
      transactions: {},
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const addMoney = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).message({
        success: false,
        message: "Please login for adding money to your wallet!",
      });
    }
    const result = await addMoneyService(req.body.amount);
    res.status(result.status).json(result);
  } catch (error) {}
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).message({
        success: false,
        message: "Please login for adding money to your wallet!",
      });
    }
    const result = await verifyPaymentService(req.body);
    res.status(result.status).json(result);
  } catch (error) {}
};
