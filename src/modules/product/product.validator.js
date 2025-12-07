import Joi from "joi";

export const productValidationSchema = Joi.object({
  productName: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 3 characters long",
  }),

  brand: Joi.string().trim().required().messages({
    "string.empty": "Brand is required",
  }),

  description: Joi.string().trim().min(10).max(1000).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters",
  }),

  isFeatured: Joi.boolean().required(),
  isListed: Joi.boolean().required(),

  variants: Joi.string()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("At least one variant is required");
        }

        const variantSchema = Joi.object({
          _id:Joi.optional(),//for edit product
          existingImages:Joi.array().optional(),//for edit product
          salePrice: Joi.number().min(0).required().messages({
            "number.base": "Sale price must be a number",
            "any.required": "Sale price is required",
          }),
          regularPrice: Joi.alternatives()
            .try(
              Joi.number().min(0),
              Joi.valid("").strip() // allows empty string
            )
            .custom((value, helpers) => {
              const { salePrice } = helpers.state.ancestors[0];
              if (value !== undefined && value !== "" && value <= salePrice) {
                throw new Error(
                  "Regular price must be greater than sale price"
                );
              }
              return value;
            }),
          ram: Joi.string().trim().required().messages({
            "string.empty": "RAM is required",
          }),
          storage: Joi.string().trim().required().messages({
            "string.empty": "Storage is required",
          }),
          colour: Joi.string().trim().min(2).required().messages({
            "string.empty": "Colour is required",
          }),
          isListed:Joi.boolean().required(),
          stockQuantity: Joi.number()
            .integer()
            .min(0)
            .required()
            .messages({
              "number.base": "Stock quantity must be a number",
              "any.required": "Stock quantity is required",
            }),
        });

        // Validate each variant and collect detailed errors
        for (let i = 0; i < parsed.length; i++) {
          const { error } = variantSchema.validate(parsed[i], {
            abortEarly: false,
          });
          if (error) {
            throw new Error(`Variant ${i + 1}: ${error.message}`);
          }
        }

        return value;
      } catch (err) {
        // Return custom message directly
        return helpers.error("string.custom", { message: err.message });
      }
    })
    .messages({
      "string.custom": "{{#message}}",
    })
    .required(),
});
