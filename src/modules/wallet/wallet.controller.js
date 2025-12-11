import {
  addMoneyService,
  loadMyWalletService,
  verifyPaymentService,
} from "./wallet.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
export const loadMyWallet = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const type = req.query.type || "";
    const limit = 5;

    const { user, wallet, transactions, totalDocuments } =
      await loadMyWalletService(req.session.user, { page, type, limit });

    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(HttpStatus.ACCEPTED).render("user/wallet", {
      key: process.env.RAZORPAY_KEY_ID,
      pageTitle: "My Wallet",
      pageJs: "wallet",
      pageCss:'wallet',
      wallet,
      transactions,
      user,
      limit,
      totalDocuments,
      query: req.query,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};



export const addMoney = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Please login for adding money to your wallet!",
      });
    }

    const result = await addMoneyService(req.body.amount);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Could not initiate payment",
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    console.log('hi')
    const userId = req.session.user;

    const result = await verifyPaymentService(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Payment verification error",
    });
  }
};

