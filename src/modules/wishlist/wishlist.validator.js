import Joi from "joi";

export const addToWishlistSchema = Joi.object({
  variantId: Joi.string()
    .required()
    .messages({
      "string.empty": "Variant ID is required",
      "any.required": "Variant ID is required",
    }),
});