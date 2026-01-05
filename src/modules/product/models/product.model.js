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

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isListed: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ brandID: 1 });
productSchema.index({ name: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });

export default mongoose.model("product", productSchema);
