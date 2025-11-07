import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },

    brandID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      required: [true, "Brand reference is required"],
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 3,
        message: "At least 3 product images must be provided",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
    },

    avgRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    totalStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    minPrice: {
      type: Number,
      default: 0,
      min: [0, "Minimum price cannot be negative"],
    },

    maxPrice: {
      type: Number,
      default: 0,
      min: [0, "Maximum price cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= this.minPrice;
        },
        message: "Max price must be greater than or equal to min price.",
      },
    },

    status: {
      type: String,
      enum: ["list", "unlist"],
      default: "unlist",
    },
  },
  { timestamps: true }
);

productSchema.index({ brandID: 1 });
productSchema.index({ name: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });

export default mongoose.model("product", productSchema);
