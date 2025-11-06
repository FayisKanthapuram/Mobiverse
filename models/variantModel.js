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
          if (this.regularPrice>0 && v > this.regularPrice) {
            return false;
          }
          return true;
        },
        message: "Sale price cannot be greater than regular price",
      },
    },
    ram: {
      type: String,
      enum: [
        "2 GB",
        "3 GB",
        "4 GB",
        "6 GB",
        "8 GB",
        "12 GB",
        "16 GB",
        "24 GB",
        "32 GB",
        "64 GB",
      ],
      default: "4 GB",
    },
    storage: {
      type: String,
      enum: [
        "16 GB",
        "32 GB",
        "64 GB",
        "128 GB",
        "256 GB",
        "512 GB",
        "1 TB",
        "2 TB",
      ],
      default: "64 GB",
    },
    color: { type: String, trim: true, required: true },
    stock: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    reviewsCount: { type: Number, default: 0 },
    isOnOffer: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("variant", productVariantSchema);
