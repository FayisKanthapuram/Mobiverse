import mongoose from "mongoose";

const tempOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderedItems: {
      type: Array, // full snapshot of items
      required: true,
    },

    shippingAddress: {
      type: Object, // full snapshot of address
      required: true,
    },

    subtotal: Number,
    discount: Number,
    couponDiscount: Number,
    tax: Number,
    deliveryCharge: Number,
    finalAmount: Number,

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    paymentMethod: {
      type: String,
      default: "razorpay",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    razorpayOrderId: String,
  },
  { timestamps: true }
);

export default mongoose.model("TempOrder", tempOrderSchema);
