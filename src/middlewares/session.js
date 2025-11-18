import dotenv from "dotenv";
dotenv.config();
import session from "express-session";
import MongoStore from "connect-mongo";

const commonCookieOptions = {
  maxAge: 1000 * 60 * 60 * 24, 
  httpOnly: true,
  secure: false,
  sameSite: 'lax',    
};

const adminSession = session({
  name: 'admin.sid',
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'adminSessions'
  }),
  cookie: commonCookieOptions
});

const userSession = session({
  name: 'user.sid',
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'userSessions'
  }),
  cookie: commonCookieOptions
});

export function sessionConfig(app) {
  app.use('/admin', adminSession);
  app.use(userSession);
}