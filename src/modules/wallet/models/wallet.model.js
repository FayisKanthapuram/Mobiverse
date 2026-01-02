import mongoose from "mongoose";

// Wallet model - schema for user wallet
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    holdBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

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

    lastTransactionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
