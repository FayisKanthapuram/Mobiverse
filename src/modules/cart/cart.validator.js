import Joi from "joi";

export const addToCartSchema = Joi.object({
  variantId: Joi.string().required().messages({
    "string.empty": "Variant ID is required",
    "any.required": "Variant ID is required",
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),

  isMoveToCart: Joi.boolean().optional().default(false).messages({
    "boolean.base": "isMoveToCart must be a boolean",
  }),
});
