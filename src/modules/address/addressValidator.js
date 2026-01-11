import Joi from "joi";

// Regex: must contain at least one letter
const textWithLetters = /^(?=.*[A-Za-z])[A-Za-z\s.'-]+$/;

export const addressSchema = Joi.object({
  addressType: Joi.string()
    .valid("home", "office", "other")
    .required()
    .messages({
      "any.only": "Invalid address type",
      "any.required": "Address type is required",
    }),

  fullName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(textWithLetters)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.pattern.base": "Full name must contain valid letters",
      "any.required": "Full name is required",
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base":
        "Phone number must be a valid 10-digit Indian number",
      "any.required": "Phone number is required",
    }),

  address1: Joi.string().trim().min(5).required().messages({
    "string.empty": "Address line 1 is required",
    "string.min": "Address line 1 must be at least 5 characters",
    "any.required": "Address line 1 is required",
  }),

  address2: Joi.string().trim().allow("", null),

  city: Joi.string()
    .trim()
    .min(2)
    .pattern(textWithLetters)
    .required()
    .messages({
      "string.empty": "City is required",
      "string.min": "City must be at least 2 characters",
      "string.pattern.base": "City must contain valid letters",
      "any.required": "City is required",
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .pattern(textWithLetters)
    .required()
    .messages({
      "string.empty": "State is required",
      "string.min": "State must be at least 2 characters",
      "string.pattern.base": "State must contain valid letters",
      "any.required": "State is required",
    }),

  pincode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/)
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be a valid 6-digit Indian pincode",
      "any.required": "Pincode is required",
    }),

  country: Joi.string().valid("India").required().messages({
    "any.only": "Only India is supported",
    "any.required": "Country is required",
  }),

  setDefault: Joi.boolean().required().messages({
    "boolean.base": "setDefault must be a boolean value",
    "any.required": "setDefault is required",
  }),
});
