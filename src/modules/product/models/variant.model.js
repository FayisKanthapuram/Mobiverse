import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      index: true,
      required: true,
    },
    regularPrice: { type: Number, default: 0 },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          if (this.regularPrice > 0 && v > this.regularPrice) {
            return false;
          }
          return true;
        },
        message: "Sale price cannot be greater than regular price",
      },
    },
    rating:{
      type:Number,
      default:0
    },
    ram: {
      type: String,
      enum: [
        "2GB",
        "3GB",
        "4GB",
        "6GB",
        "8GB",
        "12GB",
        "16GB",
        "24GB",
        "32GB",
        "64GB",
      ],
      default: "4GB",
    },
    storage: {
      type: String,
      enum: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
      default: "64GB",
    },
    colour: { type: String, trim: true, required: true },
    stock: { type: Number, default: 0, min: 0 },
    images: {
      type: [String],
      required: true,
    },
    discount: { type: Number, default: 0, min: 0 },

    isListed: {
      type: Boolean, 
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("variant", productVariantSchema);
