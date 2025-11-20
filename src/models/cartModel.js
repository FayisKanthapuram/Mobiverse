import mongoose from "mongoose";
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "variant",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
},{timestamps:true});

export default mongoose.model("cart", cartSchema);
 