import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startTempOrderCleanupCron } from "./jobs/tempOrderCleanup.cron.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    startTempOrderCleanupCron();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
