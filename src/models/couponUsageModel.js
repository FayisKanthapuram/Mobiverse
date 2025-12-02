import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'coupon',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'order',
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ userId: 1 });

export default mongoose.model("couponUsage", couponUsageSchema);
