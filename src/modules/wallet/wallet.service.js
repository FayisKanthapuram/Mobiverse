import { razorpay } from "../../config/razorpay.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { findUserById, updateUserWalletBalance } from "../user/user.repo.js";
import { createWallet, findWalletByPaymentId, findWalletByUserId, updateWalletByUserId } from "./wallet.repo.js";
import { razorpayPaymentValidation } from "./wallet.validator.js";
import crypto from "crypto";

export const loadMyWalletService = async (userId, { page, type, limit }) => {
  const user = await findUserById(userId);

  let wallet = await findWalletByUserId(userId);

  // Auto-create wallet if not exists
  if (!wallet) {
    wallet = await createWallet(userId);
  }

  const totalDocuments = wallet.transactions.length;

  const start = (page - 1) * limit;
  const end = start + limit;

  // slice only the transactions needed for that page
  wallet.transactions = wallet.transactions
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(start, end)
  
  if(type){
    wallet.transactions=wallet.transactions.filter(x=>x.type===type)
  }

  return { user, wallet, totalDocuments };
};

export const addMoneyService = async (amount) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  const order = await razorpay.orders.create(options);
  return {
    order,
    status: HttpStatus.ACCEPTED,
    success: true,
  };
};

export const verifyPaymentService = async (data, userId) => {
  try {
    // Validate payload
    const { error } = razorpayPaymentValidation.validate(data);
    if (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        success: false,
        message: error.details[0].message,
      };
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = data;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        status: HttpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Payment Verification Failed ❌",
      };
    }
    //to change to rupee
    const creditAmount = Number(amount) / 100;

    const duplicate = await findWalletByPaymentId(razorpay_payment_id)

    if (duplicate) {
      return {
        status: HttpStatus.OK,
        success: true,
        message: "Payment Already Processed ✔",
      };
    }

    // Ensure wallet exists
    let wallet = await findWalletByUserId(userId)
    if (!wallet) {
      wallet = await createWallet(userId)
    }

    const newBalance = wallet.balance + creditAmount;

    const transaction = {
      type: "credit",
      amount: creditAmount,
      description: "Wallet Top-up",
      paymentOrderId: razorpay_order_id, 
      paymentId: razorpay_payment_id,
      balanceAfter: newBalance,
      createdAt: new Date(),
    };

    await updateWalletByUserId(userId,creditAmount,transaction);

    await updateUserWalletBalance(userId,newBalance);

    return {
      status: HttpStatus.ACCEPTED,
      success: true,
      message: "Payment Verified & Wallet Credited ✔",
      newBalance,
      transaction,
    };
  } catch (err) {
    console.log(err);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Server Error ❌",
    };
  }
};
