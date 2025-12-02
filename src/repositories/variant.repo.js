import variantModel from "../models/variantModel.js";

export const findVariantById = (variantId) => {
  return variantModel.findById(variantId);
};

export const findVariantByColor = (color) => {
  return variantModel.findOne({ colour: color }).lean();
};

export const findVariantsByProduct = (productId) => {
  return variantModel.find({ productId }).lean();
};

export const decrementVariantStock = async (variantId, qty) => {
  return variantModel.updateOne({ _id: variantId }, { $inc: { stock: -qty } });
};

export const incrementVariantStock = (variantId, qty) => {
  return variantModel.updateOne({ _id: variantId }, { $inc: { stock: qty } });
};

export const findVariantByIdWithProduct = (variantId) => {
  return variantModel.findById(variantId).populate("productId");
};

export const createVariant = (data) => variantModel.create(data);

export const updateVariantById = (id, update) =>
  variantModel.findByIdAndUpdate(id, update, { new: true });

export const deleteVariantById = (id) => variantModel.findByIdAndDelete(id);

export const saveVariant = (variant) => {
  return variant.save();
};