import Joi from "joi";

export const passwordSchema = Joi.object({
  currentPassword: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      "string.empty": "Current password is required",
      "string.pattern.base":
        "Current password must be at least 8 characters long and include one uppercase letter, one lowercase letter, and one number",
    }),

  newPassword: Joi.string()
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      "string.empty": "New password is required",
      "string.pattern.base":
        "New password must be at least 8 characters long and include one uppercase letter, one lowercase letter, and one number",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password does not match new password",
      "string.empty": "Confirm password is required",
    }),

  userId: Joi.string().required(),
})
  .custom((value, helpers) => {
    if (value.currentPassword === value.newPassword) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "New password must be different from current password",
  });
