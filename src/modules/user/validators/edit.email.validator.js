import Joi from "joi";

// Validation schema for editing email
export const emailSchema = Joi.object({
  newEmail: Joi.string()
    .email()
    .required()
    .disallow(Joi.ref("oldEmail"))
    .messages({
      "string.email": "Please enter a valid email",
      "string.empty": "Email is required",
      "any.invalid": "New email should not match old email",
    }),
  oldEmail: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please enter a valid email",
      "string.empty": "Email is required",
    }),
});