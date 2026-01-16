import OrderLock from "../models/order.lock.model.js";

export const acquireUserOrderLock = async (userId, session) => {
  try {
    await OrderLock.create(
      [
        {
          userId,
          lockedAt: new Date(),
        },
      ],
      { session }
    );

    return true; //  lock acquired
  } catch (err) {
    // Duplicate key error → lock already exists
    if (err.code === 11000) {
      return false;
    }

    throw err; // real DB error
  }
};

export const releaseUserOrderLock = async (userId, session) => {
  await OrderLock.deleteOne({ userId }, { session });
};