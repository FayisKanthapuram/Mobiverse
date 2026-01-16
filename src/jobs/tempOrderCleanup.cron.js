import cron from "node-cron";
import { cleanupExpiredTempOrders } from "./temp.order.cleanup.job.js";

export const startTempOrderCleanupCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await cleanupExpiredTempOrders();
    } catch (err) {
      console.error("❌ Temp order cleanup failed:", err);
    }
  });
};
