import express from "express";
import dotenv from "dotenv";
import nocache from "nocache";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoute.js";
import { connectDB } from "./config/db.js";
import passport from "./config/passport.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false,
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

app.use(nocache());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));

app.use("/user", userRoutes);
app.use("/admin", adminRoutes);


connectDB()

const port = process.env.PORT || 2222;
app.listen(port, () => {
  console.log(`server is running at the port number : ${port}`);
});
