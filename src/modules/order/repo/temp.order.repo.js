import TempOrder from "../models/temp.order.model.js";

// Temporary order repository - handle temp orders for pending payments
// Create temporary order
export const createTempOrder = (data, session) => {
  return TempOrder.create([data], { session });
};

// Update temporary order
export const updateTempOrder = (id, data, session) => {
  const options = session ? { session } : {};
  return TempOrder.updateOne({ _id: id }, { $set: data }, { options });
};

// Find temporary order by ID
export const findTempOrderById = (id) => {
  return TempOrder.findById(id);
};

// Delete temporary order
export const deleteTempOrder = (id, session) => {
  const options = session ? { session } : {};
  return TempOrder.deleteOne({ _id: id }, options);
};

