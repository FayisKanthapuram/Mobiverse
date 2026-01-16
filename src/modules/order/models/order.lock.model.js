import mongoose from "mongoose";

const orderLockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // only one active lock per user
      index: true,
    },

    lockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

orderLockSchema.index(
  { lockedAt: 1 },
  { expireAfterSeconds: 300 } // 5 minutes
);

const OrderLock = mongoose.model("OrderLock", orderLockSchema);
export default OrderLock;
