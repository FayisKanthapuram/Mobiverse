import Joi from "joi";
export const otpSchema = Joi.object({
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.base": "OTP must be a string of 6 digits.",
      "string.empty": "OTP is required.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only digits.",
      "any.required": "OTP is required.",
    }),
});
