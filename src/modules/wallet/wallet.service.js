import mongoose from "mongoose";
import { razorpay } from "../../config/razorpay.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { findUserById, updateUserWalletBalance } from "../user/user.repo.js";
import {
  createLedgerEntry,
  findFilteredTransationCount,
  findTransationByPaymentId,
  findTransations,
} from "./repo/wallet.ledger.repo.js";
import {
  createWallet,
  findWalletByUserId,
  saveWallet,
  updateWalletBalanceAndCredit,
} from "./repo/wallet.repo.js";
import { razorpayPaymentValidation } from "./wallet.validator.js";
import crypto from "crypto";
import { AppError } from "../../shared/utils/app.error.js";
import { WalletMessages } from "../../shared/constants/messages/walletMessages.js";

// Wallet service - wallet and ledger operations
export const loadMyWalletService = async (userId, { page, type, limit }) => {
  const user = await findUserById(userId);

  let wallet = await findWalletByUserId(userId);
  if (!wallet) wallet = await createWallet(userId);

  // Prepare transaction filter and fetch ledger entries
  const filter = { userId };
  if (type === "CREDIT") filter.type = { $in: ["CREDIT", "REFERRAL"] };
  else if (type === "DEBIT") filter.type = type;
  else filter.type = { $in: ["CREDIT", "DEBIT", "REFERRAL"] };

  const totalDocuments = await findFilteredTransationCount(filter);

  const transactions = await findTransations(filter, page, limit);

  return { user, wallet, transactions, totalDocuments };
};

export const addMoneyService = async (amount) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "wallet_" + Date.now(),
  };

  const order = await razorpay.orders.create(options);

  return {
    order,
    status: HttpStatus.ACCEPTED,
    success: true,
  };
};

export const verifyPaymentService = async (data, userId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { error } = razorpayPaymentValidation.validate(data);
    if (error) {
      throw {
        status: HttpStatus.BAD_REQUEST,
        message: error.details[0].message,
      };
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = data;

    // Validate Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw {
        status: HttpStatus.NOT_ACCEPTABLE,
        message: WalletMessages.PAYMENT_VERIFICATION_FAILED,
      };
    }

    // Convert paise → rupees
    const creditAmount = Number(amount) / 100;

    // Prevent duplicate payment
    const duplicate = await findTransationByPaymentId(
      razorpay_payment_id,
      "CREDIT"
    );

    if (duplicate) {
      return {
        status: HttpStatus.ALREADY_REPORTED,
        success: true,
        message: WalletMessages.PAYMENT_ALREADY_PROCESSED,
      };
    }

    // Ensure wallet exists
    let wallet = await findWalletByUserId(userId, session);
    if (!wallet) wallet = await createWallet(userId, session);

    // Increase balance
    wallet.balance += creditAmount;
    wallet.totalCredits += creditAmount;
    wallet.lastTransactionAt = new Date();
    await saveWallet(wallet, session);

    const entry = {
      walletId: wallet._id,
      userId,
      amount: creditAmount,
      type: "CREDIT",
      note: WalletMessages.WALLET_TOP_UP_NOTE,
      referenceId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      balanceAfter: wallet.balance,
    };

    // Save LEDGER entry
    await createLedgerEntry(entry, session);

    await updateUserWalletBalance(userId, wallet.balance, session);

    await session.commitTransaction();
    session.endSession();

    return {
      status: HttpStatus.ACCEPTED,
      success: true,
      message: WalletMessages.WALLET_CREDITED_SUCCESS,
      newBalance: wallet.balance,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log(error);
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: error.message,
    };
  }
};

export const creditReferralBonusToNewUser = async (userId, amount) => {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new AppError(WalletMessages.WALLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const newBalance = wallet.balance + amount;

  await updateWalletBalanceAndCredit(userId, amount);
  await updateUserWalletBalance(userId, newBalance);

  await createLedgerEntry({
    walletId: wallet._id,
    userId,
    amount,
    balanceAfter: newBalance,
    type: "REFERRAL",
    note: WalletMessages.REFERRAL_SIGNUP_BONUS,
  });
};
