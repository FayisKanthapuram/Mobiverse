import {
  addMoneyService,
  loadMyWalletService,
  verifyPaymentService,
} from "./wallet.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
export const loadMyWallet = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const type=req.query.type||'';
    const limit = 4;

    const { user, wallet, totalDocuments } = await loadMyWalletService(
      req.session.user,
      { page,type, limit }
    );

    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).render("user/wallet", {
      key: process.env.RAZORPAY_KEY_ID,
      pageTitle: "My Wallet",
      pageJs: "wallet",
      wallet,
      transactions: wallet?.transactions || [],
      user,
      query: req.query,
      totalPages,
      currentPage: page,
      limit,
      totalDocuments,
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
  } catch (error) {
    console.log("Payment Update Error:", error);

    res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while verify payment",
    });
  }
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
    const result = await verifyPaymentService(req.body,userId);
    res.status(result.status).json(result);
  } catch (error) {
    console.log("Payment Update Error:", error);

    res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while verify payment",
    });
  }
};
