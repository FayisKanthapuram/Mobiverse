import Joi from "joi";

// Brand validator - Joi schema for brand inputs
export const brandValidation = Joi.object({
  brandId: Joi.string().optional().allow(null, ""),
  brandName: Joi.string().min(2).max(50).required(),
});
