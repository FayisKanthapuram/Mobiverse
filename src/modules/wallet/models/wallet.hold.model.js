import mongoose from "mongoose";

// Wallet hold model - temporary hold records for pending transactions
const walletHoldSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    amount: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["HELD", "CAPTURED", "RELEASED"],
      default: "HELD",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalletHold", walletHoldSchema);
