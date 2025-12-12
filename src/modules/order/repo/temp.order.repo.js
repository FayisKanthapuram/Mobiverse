import TempOrder from "../models/temp.order.model.js";

export const createTempOrder = (data, session) => {
  return TempOrder.create([data], { session });
};

export const updateTempOrder = (id, data, session) => {
  return TempOrder.updateOne({ _id: id }, { $set: data }, { session });
};

export const findTempOrderById = (id) => {
  return TempOrder.findById(id);
};
