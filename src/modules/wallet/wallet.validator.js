import Joi from "joi";

// Validation schemas for wallet-related requests
export const razorpayPaymentValidation = Joi.object({
  razorpay_order_id: Joi.string().trim().required(),
  razorpay_payment_id: Joi.string().trim().required(),
  razorpay_signature: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
});
