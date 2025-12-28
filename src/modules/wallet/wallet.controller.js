import {
  addMoneyService,
  loadMyWalletService,
  verifyPaymentService,
} from "./wallet.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";

/* ----------------------------------------------------
   LOAD MY WALLET
---------------------------------------------------- */
export const loadMyWallet = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const type = req.query.type || "";
  const limit = 5;

  const { user, wallet, transactions, totalDocuments } =
    await loadMyWalletService(req.user._id, { page, type, limit });

  const totalPages = Math.ceil(totalDocuments / limit);

  res.status(HttpStatus.OK).render("user/wallet", {
    key: process.env.RAZORPAY_KEY_ID,
    pageTitle: "My Wallet",
    pageJs: "wallet",
    pageCss: "wallet",
    wallet,
    transactions,
    user,
    limit,
    totalDocuments,
    query: req.query,
    totalPages,
    currentPage: page,
  });
};

/* ----------------------------------------------------
   ADD MONEY TO WALLET
---------------------------------------------------- */
export const addMoney = async (req, res) => {
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    throw new AppError("Invalid amount", HttpStatus.BAD_REQUEST);
  }

  const result = await addMoneyService(amount);

  res.status(result.status).json(result);
};

/* ----------------------------------------------------
   VERIFY PAYMENT
---------------------------------------------------- */
export const verifyPayment = async (req, res) => {
  const userId = req.user._id;

  const result = await verifyPaymentService(req.body, userId);

  res.status(result.status).json(result);
};
