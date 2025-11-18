import express from "express";
import dotenv from "dotenv";
import nocache from "nocache";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import { sessionConfig } from "./middlewares/session.js";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoute.js";
import { connectDB } from "./config/db.js";
import passport from "./config/passport.js";
import { logger } from "./middlewares/logger.js";
import { setUser } from "./middlewares/setUser.js";

const app = express();

// Environment variables
dotenv.config();

// ES module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
sessionConfig(app);
app.use(setUser)
app.use(passport.initialize());
app.use(passport.session());
app.use(nocache());

// Static + Views
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("views", path.join(__dirname, "../views"));

// Routes
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT;

// Start server after DB connect
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});