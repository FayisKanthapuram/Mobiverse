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

export const OrderItemsSchema = Joi.object({
  itemIds: Joi.array()
    .items(Joi.string().hex().length(24)) // ObjectId validation
    .min(1)
    .required()
    .messages({
      "array.base": "itemIds must be an array",
      "array.min": "At least one itemId is required",
      "string.hex": "Invalid itemId format",
    }),

  reason: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      "string.empty": "Reason is required",
      "string.min": "Reason must be at least 3 characters",
    }),

  comments: Joi.string()
    .trim()
    .allow("")
    .max(500)
    .messages({
      "string.max": "Comments can be up to 500 characters",
    }),
});