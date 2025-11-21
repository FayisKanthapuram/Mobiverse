import Joi from "joi";

export const orderValidation = Joi.object({
  addressId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Address ID is required",
      "any.required": "Address ID is required",
      "string.pattern.base": "Invalid address ID format",
    }),

  paymentMethod: Joi.string()
    .valid("razorpay", "cod", "wallet")
    .required()
    .messages({
      "any.only": "Invalid payment method",
      "string.empty": "Payment method is required",
      "any.required": "Payment method is required",
    }),
});