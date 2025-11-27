import Joi from "joi";

export const offerSchema = Joi.object({
  offerType: Joi.string()
    .valid("product", "brand")
    .required(),

  offerName: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Offer name is required",
    }),

  discountType: Joi.string()
    .valid("percentage", "fixed")
    .required(),

  discountValue: Joi.number()
    .min(1)
    .required()
    .when("discountType", {
      is: "percentage",
      then: Joi.number().max(90).messages({
        "number.max": "Percentage discount cannot exceed 90%",
      }),
    }),

  // Product offer requires productID array  
  productID: Joi.array()
    .items(Joi.string().length(24))
    .when("offerType", {
      is: "product",
      then: Joi.array()
        .min(1)
        .required()
        .messages({
          "array.min": "At least one product must be selected for product offer",
          "any.required": "Product list is required for product offer",
        }),
      otherwise: Joi.forbidden(),
    }),

  // Brand offer requires brandID
  brandID: Joi.string()
    .length(24)
    .when("offerType", {
      is: "brand",
      then: Joi.string()
        .required()
        .messages({
          "any.required": "Brand is required for brand offer",
        }),
      otherwise: Joi.forbidden(),
    }),

  startDate: Joi.date().required(),

  endDate: Joi.date()
    .greater(Joi.ref("startDate"))
    .required()
    .messages({
      "date.greater": "End date must be greater than start date",
    }),

  isActive: Joi.boolean().optional(),
});