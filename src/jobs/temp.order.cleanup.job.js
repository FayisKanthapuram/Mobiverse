import mongoose from "mongoose";
import { releaseReservedStock } from "../modules/product/repo/variant.repo.js";
import { deleteTempOrder, findExpiredTempOrders } from "../modules/order/repo/temp.order.repo.js";

export const cleanupExpiredTempOrders = async () => {
  const session = await mongoose.startSession();

  try {
    const now = new Date();

    const expiredOrders = await findExpiredTempOrders(now,session)

    for (const order of expiredOrders) {
      session.startTransaction();

      try {
        for (const item of order.orderedItems) {
          await releaseReservedStock(item.variantId, item.quantity, session);
        }

        await deleteTempOrder(order._id,session);

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        console.error(`Failed to cleanup temp order ${order._id}`, err);
      }
    }
  } finally {
    session.endSession();
  }
};
