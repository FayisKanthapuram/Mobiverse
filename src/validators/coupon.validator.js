import Joi from 'joi';
import mongoose from 'mongoose';

export const couponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(20)
    .required(),

  name: Joi.string()
    .trim()
    .required(),

  description: Joi.string()
    .allow("", null),

  type: Joi.string()
    .valid("percentage", "fixed")
    .required(),

  discountValue: Joi.number()
    .min(1)
    .required()
    .when("type", {
      is: "percentage",
      then: Joi.number().max(90),
      otherwise: Joi.number()
    }),

  maxDiscount: Joi.number()
    .min(0)
    .default(0),

  minPurchaseAmount: Joi.number()
    .min(0)
    .default(0),

  usageLimitPerUser: Joi.number()
    .min(0)
    .default(1),

  totalUsageLimit: Joi.number()
    .min(0)
    .default(0),

  currentUsageCount: Joi.number()
    .min(0)
    .default(0),

  userEligibility: Joi.string()
    .valid("all", "new_users", "specific")
    .default("all"),

  specificUsers: Joi.array()
    .items(
      Joi.string()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        }, "ObjectId Validation")
    )
    .default([]),

  startDate: Joi.date()
    .required(),

  endDate: Joi.date()
    .required(),

  isActive: Joi.boolean()
    .default(true)
})
.custom((data, helpers) => {
  // Validate date range
  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    return helpers.error("any.invalid", "Start date cannot be greater than end date");
  }
  return data;
}, "Date range validation");