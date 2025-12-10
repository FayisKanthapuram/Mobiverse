import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    _id: false,
    transactionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    paymentId: String, // Razorpay payment_id
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [transactionSchema],
    totalCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDebits: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Indexing
walletSchema.index({ "transactions.createdAt": -1 });

export default mongoose.model("Wallet", walletSchema);
