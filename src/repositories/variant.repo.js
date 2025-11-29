import variantModel from "../models/variantModel.js";

export const findVariantById = (variantId) => {
  return variantModel.findById(variantId).lean();
};

export const findVariantByColor = (color) => {
  return variantModel.findOne({ colour: color }).lean();
};

export const findVariantsByProduct = (productId) => {
  return variantModel.find({ productId }).lean();
};

export const decrementVariantStock = async (variantId, qty) => {
  return variantModel.updateOne(
    { _id: variantId },
    { $inc: { stock: -qty } }
  );
};
