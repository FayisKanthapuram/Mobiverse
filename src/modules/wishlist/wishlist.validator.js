import Joi from "joi";

// Wishlist validator - request validation schemas

export const addToWishlistSchema = Joi.object({
  variantId: Joi.string()
    .required()
    .messages({
      "string.empty": "Variant ID is required",
      "any.required": "Variant ID is required",
    }),
});