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

    orderedItems: {
      type: [
        {
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
          quantity: {
            type: Number,
            required: true,
          },
          regularPrice: Number,
          offer: Number,
          price: {
            type: Number,
            required: true,
          },
          couponShare: Number,
        },
      ],
      required: true,
    },

    shippingAddress: { type: Object, required: true },

    subtotal: Number,
    discount: Number,
    couponDiscount: Number,
    couponCode: String,
    couponId: String,

    finalAmount: Number,

    paymentMethod: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);


export default mongoose.model("TempOrder", tempOrderSchema);
