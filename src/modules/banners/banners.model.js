// Banner model - Mongoose schema for banners
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      required: [true, "Banner subtitle is required"],
      trim: true,
      maxlength: [250, "Subtitle cannot exceed 250 characters"],
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      desktop: {
        type: String,
        required: [true, "Desktop banner image is required"],
      },
      tablet: {
        type: String,
        default: "",
      },
      mobile: {
        type: String,
        default: "",
      },
    },
    order: {
      type: Number,
      default: 1,
      min: [1, "Order must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Scheduling fields
    scheduledStart: {
      type: Date,
      default: null,
    },
    scheduledEnd: {
      type: Date,
      default: null,
    },
    // Track if banner is scheduled
    isScheduled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ scheduledStart: 1, scheduledEnd: 1 });

// Virtual to check if banner should be displayed based on schedule
bannerSchema.virtual("isCurrentlyActive").get(function () {
  if (!this.isActive) return false;
  if (!this.isScheduled) return true;

  const now = new Date();
  const hasStarted = !this.scheduledStart || this.scheduledStart <= now;
  const hasNotEnded = !this.scheduledEnd || this.scheduledEnd >= now;

  return hasStarted && hasNotEnded;
});

// Method to get active banners sorted by order (with scheduling support)
bannerSchema.statics.getActiveBanners = function () {
  const now = new Date();

  return this.find({
    isActive: true,
    $or: [
      { isScheduled: false },
      {
        isScheduled: true,
        $or: [
          { scheduledStart: null, scheduledEnd: null },
          { scheduledStart: { $lte: now }, scheduledEnd: null },
          { scheduledStart: null, scheduledEnd: { $gte: now } },
          { scheduledStart: { $lte: now }, scheduledEnd: { $gte: now } },
        ],
      },
    ],
  })
    .sort({ order: 1, createdAt: -1 })
    .select("-__v");
};

// Instance method to check if banner is expired
bannerSchema.methods.isExpired = function () {
  if (!this.isScheduled || !this.scheduledEnd) return false;
  return new Date() > this.scheduledEnd;
};

// Instance method to check if banner is upcoming
bannerSchema.methods.isUpcoming = function () {
  if (!this.isScheduled || !this.scheduledStart) return false;
  return new Date() < this.scheduledStart;
};

export default mongoose.model("Banner", bannerSchema);
