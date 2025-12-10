import Joi from "joi";

export const razorpayPaymentValidation = Joi.object({
  razorpay_order_id: Joi.string().trim().required(),
  razorpay_payment_id: Joi.string().trim().required(),
  razorpay_signature: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
});
