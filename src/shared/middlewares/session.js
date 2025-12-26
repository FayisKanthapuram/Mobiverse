import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config()

const common = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
};

// USER SESSION (Passport)
export const userSession = session({
  ...common,
  name: "user.sid",
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "userSessions",
  }),
});

// ADMIN SESSION (No Passport)
export const adminSession = session({
  ...common,
  name: "admin.sid",
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "adminSessions",
  }),
});

export const sessionConfig = (app) => {
  app.use("/admin", adminSession); // admin only
  app.use(userSession);          // for users + passport
};
