import Joi from "joi";

const strongPasswordRegex =
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{6,}$";

export const userRegisterSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot be more than 30 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email",
    "string.empty": "Email is required",
  }),

  password: Joi.string()
    .pattern(new RegExp(strongPasswordRegex))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be at least 6 characters long and include uppercase, lowercase, number, and a special character",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password is required",
    }),

  referralCode: Joi.string()
    .alphanum()
    .length(8)
    .allow("")
    .optional()
    .messages({
      "string.length": "Referral code must be 8 characters",
      "string.alphanum": "Referral code must contain only letters and numbers",
    }),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email",
    "string.empty": "Email is required",
  }),

  password: Joi.string().min(4).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 4 characters",
  }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .pattern(new RegExp(strongPasswordRegex))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be at least 6 characters long and include uppercase, lowercase, number, and a special character",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password is required",
    }),
});
