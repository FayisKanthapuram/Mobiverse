import dotenv from "dotenv";
dotenv.config();
import session from "express-session";
import MongoStore from "connect-mongo";

export const sessionMiddleware = session({
  name: "app.sid",
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: false, // true only in HTTPS production
    sameSite: "lax",
  },
});