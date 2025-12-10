import { razorpay } from "../../config/razorpay.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { findUserById } from "../user/user.repo.js";
import { findWalletByUserId } from "./wallet.repo.js";
import { razorpayPaymentValidation } from "./wallet.validator.js";

export const loadMyWalletService = async (userId) => {
  const user = await findUserById(userId);
  const wallet = await findWalletByUserId(userId);
  return { user, wallet };
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

export const verifyPaymentService = async (data) => {
  const { error } = razorpayPaymentValidation.validate(data);
  if (error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: error.details[0].message,
    };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return {
      status: HttpStatus.ACCEPTED,
      success: true,
      message: "Payment Verified ✔",
    };
  } else {
    return {
      status: HttpStatus.NOT_ACCEPTABLE,
      success: false,
      message: "Payment Verification Failed ❌",
    };
  }
  
};
