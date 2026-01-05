import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "variant",
      required: true,
    },

    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // 1 review per purchased item
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { timestamps: true }
);

export default mongoose.model("review", reviewSchema);
