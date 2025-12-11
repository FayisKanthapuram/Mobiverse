import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    // User who sent the referral
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User who was referred
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Referral code used
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    // Status of the referral
    status: {
      type: String,
      enum: ["REGISTERED", "PENDING", "COMPLETED"],
      default: "REGISTERED",
      index: true,
    },
    // REGISTERED - User signed up but hasn't ordered
    // PENDING - User ordered but payment not confirmed
    // COMPLETED - User ordered and referrer got reward

    // Reward amount given to referrer
    rewardAmount: {
      type: Number,
      default: 100,
    },

    // Whether reward has been credited
    rewardCredited: {
      type: Boolean,
      default: false,
    },

    // Date when reward was credited
    rewardCreditedAt: {
      type: Date,
    },

    // First order of referred user (optional reference)
    firstOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // Wallet transaction reference (when reward is given)
    walletTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletLedger",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referredUser: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: -1 });

export default mongoose.model("Referral", referralSchema);
