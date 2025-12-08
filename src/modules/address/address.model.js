import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    addressType:{type:String,enum:['home','office','other']},
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String},
    city: { type: String },
    state: { type: String },
    pincode: { type: String, required: true },
    country: { type: String },
    setDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("address", addressSchema);