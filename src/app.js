import express from "express";
import dotenv from "dotenv";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import { sessionConfig } from "./shared/middlewares/session.js";
import { fileURLToPath } from "url";
import adminRoutes from "./shared/routes/adminRoute.js";
import userRoutes from "./shared/routes/userRoute.js";
import passport from "./config/passport.js";
import { logger } from "./shared/utils/logger.js";
import { setUser } from "./shared/middlewares/setUser.js";
import {
  errorHandler,
  notFound,
  staticFile404,
} from "./shared/middlewares/errorMiddlewares.js";
import { limiter } from "./shared/middlewares/ratelimit.js";

dotenv.config();

const app = express();

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic middleware
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions FIRST
sessionConfig(app);

// Passport AFTER sessions
app.use(passport.initialize());
app.use(passport.session());

// user middleware
app.use(setUser);
app.use(limiter);

// Static + views
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("views", path.join(__dirname, "../views"));

// Routes
app.use("/", userRoutes);      
app.use("/admin", adminRoutes); 

// Errors
app.use(staticFile404);
app.use(notFound);
app.use(errorHandler);


export default app;
