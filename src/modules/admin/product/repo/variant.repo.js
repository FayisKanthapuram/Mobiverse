import mongoose from "mongoose";
import variantModel from "../models/variant.model.js";

export const findVariantById=(variantId)=>{
  return variantModel.findById(variantId);
}

export const findVariantByIdAgg = (variantId, userId) => {
  return variantModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(variantId) },
    },
    //is in cart
    {
      $lookup: {
        from: "carts",
        let: {
          variantId: "$_id",
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$variantId", "$variantId"] },
                  { $eq: ["$$userId", "$userId"] },
                ],
              },
            },
          },
          {
            $project: { _id: 1 },
          },
        ],
        as: "cart",
      },
    },
    {
      $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: { cart: "$cart._id" },
    },
  ]);
};

export const findVariantByColor = (colour,variantId,userId) => {
  return variantModel.aggregate([
    {
      $match: {_id: new mongoose.Types.ObjectId(variantId),colour:colour},
    },
    //is in cart
    {
      $lookup: {
        from: "carts",
        let: {
          variantId: "$_id",
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$variantId", "$variantId"] },
                  { $eq: ["$$userId", "$userId"] },
                ],
              },
            },
          },
          {
            $project: { _id: 1 },
          },
        ],
        as: "cart",
      },
    },
    {
      $unwind: { path: "$cart", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: { cart: "$cart._id" },
    },
  ]);
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
