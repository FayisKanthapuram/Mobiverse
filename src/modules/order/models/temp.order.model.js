import mongoose from "mongoose";

const tempOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "address",
      required: true,
    },

    orderedItems: { type: Array, required: true },

    shippingAddress: { type: Object, required: true },

    subtotal: Number,
    discount: Number,
    couponDiscount: Number,
    couponId: { type: String },

    finalAmount: Number,

    paymentMethod: { type: String, enum: ["razorpay"], default: "razorpay" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model("TempOrder", tempOrderSchema);
