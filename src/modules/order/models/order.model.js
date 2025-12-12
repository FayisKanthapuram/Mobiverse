import mongoose from "mongoose";
import crypto from "crypto";

// -------------------------------
// Ordered Item Schema
// -------------------------------
const orderedItemSchema = new mongoose.Schema({
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

  quantity: { type: Number, required: true, min: 1 },
  regularPrice: { type: Number },
  offer: { type: Number },
  price: { type: Number, required: true }, // sale price at time of purchase

  // Item-level status
  itemStatus: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "ReturnRequested",
      "ReturnRejected",
      "ReturnApproved",
      "Returned",
    ],
    default: "Pending",
  },

  // Item-level timeline
  itemTimeline: {
    confirmedAt: Date,
    processedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    returnRequestedAt: Date,
    returnRejectedAt: Date,
    returnApprovedAt: Date,
    returnedAt: Date,
  },

  // Reason for cancel / return
  reason: { type: String },
  adminNote: { type: String },
});

// -------------------------------
// Shipping Address Snapshot Schema
// -------------------------------
const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
  addressType: { type: String }, // home / office / other
});

// -------------------------------
// Main Order Schema
// -------------------------------
const orderSchema = new mongoose.Schema(
  {
    // Human readable custom order id
    orderId: { type: String, unique: true, index: true },

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

    // Overall order status
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Partially Delivered",
        "Partially Cancelled",
        "Partially Returned",
      ],
      default: "Pending",
    },

    // Order-level timeline (optional but useful)
    statusTimeline: {
      confirmedAt: Date,
      processedAt: Date,
      shippedAt: Date,
      outForDeliveryAt: Date,
      deliveredAt: Date,
      cancelledAt: Date,
      returnedAt: Date,
    },

    orderedItems: [orderedItemSchema], // updated schema

    shippingAddress: shippingAddressSchema,

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "wallet"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      walletTransactionId: String,
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponId: { type: String },
    deliveryCharge: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },

    razorpayOrderId: {
      type: String,
      default: null, // store Razorpay order_id
    },

    razorpayPaymentId: {
      type: String,
      default: null, // store Razorpay payment_id
    },

    expectedDelivery: { type: Date },
    deliveredDate: { type: Date },
  },
  { timestamps: true }
);

// -------------------------------
// Auto-generate human-readable orderId
// -------------------------------
orderSchema.pre("save", function (next) {
  if (!this.orderId) {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    this.orderId = `ORD-${date}-${random}`;
  }
  next();
});

// -------------------------------
const Order = mongoose.model("Order", orderSchema);
export default Order;
