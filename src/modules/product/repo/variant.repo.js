import mongoose from "mongoose";
import variantModel from "../models/variant.model.js";

// Variant repository - data access for product variants
// Find variant by ID
export const findVariantById = (variantId) => {
  return variantModel.findById(variantId);
}


export const findVariantByIdAgg = (variantId, userId) => {
  return variantModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(variantId),
      },
    },

    // 🔍 check if variant exists in user's cart.items
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
                $eq: ["$userId", "$$userId"],
              },
            },
          },
          { $unwind: "$items" },
          {
            $match: {
              $expr: {
                $eq: ["$items.variantId", "$$variantId"],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "cart",
      },
    },

    // convert lookup result → boolean
    {
      $addFields: {
        isInCart: { $gt: [{ $size: "$cart" }, 0] },
      },
    },

    // cleanup
    {
      $project: {
        cart: 0,
      },
    },
  ]);
};


// Find variants belonging to a product
export const findVariantsByProduct = (productId) => {
  return variantModel.find({ productId }).lean();
};


// Decrement variant stock
export const decrementVariantStock = (variantId, qty, session = null) => {
  const options = session ? { session } : {};
  return variantModel.updateOne(
    { _id: variantId },
    { $inc: { stock: -qty } },
    options
  );
};


// Increment variant stock
export const incrementVariantStock = (variantId, qty, session = null) => {
  const options = session ? { session } : {};
  return variantModel.updateOne(
    { _id: variantId },
    { $inc: { stock: qty } },
    options
  );
};

// Find variant and populate product
export const findVariantByIdWithProduct = (variantId) => {
  return variantModel.findById(variantId).populate("productId");
};

// Create a new variant
export const createVariant = (data) => variantModel.create(data);

// Update variant by ID
export const updateVariantById = (id, update) =>
  variantModel.findByIdAndUpdate(id, update, { new: true });

// Delete a variant
export const deleteVariantById = (id) => variantModel.findByIdAndDelete(id);

// Save variant document
export const saveVariant = (variant) => {
  return variant.save();
};
