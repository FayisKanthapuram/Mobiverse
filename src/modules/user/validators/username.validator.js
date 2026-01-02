import Joi from "joi";

// Validation schema for username
export const usernameValidator = Joi.object({
  username: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must have at least 2 characters",
    "string.max": "Username cannot exceed 50 characters",
  }),
  removePhoto: Joi.boolean().optional(),
});