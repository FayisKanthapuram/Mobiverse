import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offerType: {
      type: String,
      enum: ['product', 'brand'],
      required: true
    },
    offerName: {
      type: String,
      required: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: function(v) {
          // If percentage, max is 90
          if (this.discountType === 'percentage' && v > 90) {
            return false;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 90%'
      }
    },
    // For Product Offers 
    productID: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product'
    }],
    // For Brand Offers
    brandID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'brand',
      required: function() { return this.offerType === 'brand'; }
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
offerSchema.index({ offerType: 1 });
offerSchema.index({ isActive: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ productID: 1 });
offerSchema.index({ brandID: 1 });

export default mongoose.model("offer", offerSchema);