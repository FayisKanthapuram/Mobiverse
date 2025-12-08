import Joi from "joi";

export const addressSchema = Joi.object({
  
  addressType: Joi.string()
    .valid("home", "office", "other")
    .required()
    .messages({
      "any.only": "Invalid address type",
      "string.empty": "Address type is required",
    }),

  fullName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/) // Indian 10-digit number
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be a valid 10-digit Indian number",
    }),

  address1: Joi.string()
    .trim()
    .min(5)
    .required()
    .messages({
      "string.empty": "Address line 1 is required",
      "string.min": "Address line 1 must be at least 5 characters",
    }),

  address2: Joi.string()
    .allow("", null) // optional
    .trim(),

  city: Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      "string.empty": "City is required",
      "string.min": "City must be at least 2 characters",
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      "string.empty": "State is required",
    }),

  pincode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/) // Indian 6-digit pincode
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be a valid 6-digit number",
    }),

  country: Joi.string()
    .valid("India")
    .required(),

  setDefault: Joi.boolean().required(),
});