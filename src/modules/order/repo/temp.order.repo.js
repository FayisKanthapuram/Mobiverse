import TempOrder from "../models/temp.order.model.js";

export const createTempOrder = (data, session) => {
  return TempOrder.create([data], { session });
};

export const updateTempOrder = (id, data, session) => {
  const options = session ? { session } : {};
  return TempOrder.updateOne({ _id: id }, { $set: data }, { options });
};

export const findTempOrderById = (id) => {
  return TempOrder.findById(id);
};

export const deleteTempOrder = (id, session) => {
  const options = session ? { session } : {};
  return TempOrder.deleteOne({ _id: id }, options);
};

