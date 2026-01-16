import TempOrder from "../models/temp.order.model.js";

// Temporary order repository - handle temp orders for pending payments
// Create temporary order
export const createTempOrder = (data, session) => {
  return TempOrder.create([data], { session });
};

// Update temporary order
export const updateTempOrder = (userId,id, data, session) => {
  const options = session ? { session } : {};
  return TempOrder.updateOne({ _id: id ,userId}, { $set: data }, { options });
};

// Find temporary order by ID
export const findTempOrderById = (id, userId, session=null) => {
  const options = session ? { session } : {};
  return TempOrder.findOne({ _id: id, userId }, {}, options);
};

// Delete temporary order
export const deleteTempOrder = (id, session) => {
  const options = session ? { session } : {};
  return TempOrder.deleteOne({ _id: id }, options);
};


export const findActiveTempOrderByUser = (userId, session = null) => {
  const options = session ? { session } : {};

  return TempOrder.findOne(
    {
      userId,
      paymentStatus: { $in: ["Pending", "Failed"] },
      expiresAt: { $gt: new Date() },
    },
    {},
    options
  );
};

// Delete temp order by id
export const deleteTempOrderById = (tempOrderId, session = null) => {
  const options = session ? { session } : {};
  return TempOrder.deleteOne({ _id: tempOrderId }, options);
};

export const markTempOrderPaymentFailed = (
  tempOrderId,
  userId,
  session = null
) => {
  const options = session ? { session } : {};
  return TempOrder.updateOne(
    { _id: tempOrderId, userId },
    {
      $set: {
        paymentStatus: "Failed",
        razorpayPaymentId: null,
        razorpaySignature: null,
      },
    },
    options
  );
};

export const findExpiredTempOrders = async (now, session = null) => {
  return TempOrder.find(
    {
      expiresAt: { $lt: now },
    },
    null,
    { session }
  );
};

