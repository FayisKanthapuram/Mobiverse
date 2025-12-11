import mongoose from "mongoose";
import { DEFAULT_USER_AVATAR } from "../../config/cloudinaryDefaults.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: { type: String, default: DEFAULT_USER_AVATAR },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    referralRewards: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
