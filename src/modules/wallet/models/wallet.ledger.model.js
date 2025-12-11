import mongoose from "mongoose";

const walletLedgerSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    type: {
      type: String,
      enum: ["CREDIT", "DEBIT", "REFUND", "HOLD", "RELEASE", "REFERRAL"],
      required: true,
    },

    referenceId: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null, // store Razorpay order_id
    },

    razorpayPaymentId: {
      type: String,
      default: null, // store Razorpay payment_id
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalletLedger", walletLedgerSchema);
