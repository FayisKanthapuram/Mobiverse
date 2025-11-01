import express from "express";
import setLayout from "../middlewares/setLayout.js";
const router = express.Router();
import passport from "passport";

import { loadHome } from "../controllers/user/userController.js";
import {
  loadSignUp,
  registerUser,
  loadLogin,
  googleLogin
} from "../controllers/user/authController.js";
import { isLogin, requireLogin } from "../middlewares/userAuth.js";

router.use(setLayout("user"));

//login
router.get('/login',loadLogin)

//signup
router.get("/signup",isLogin, loadSignUp);
router.post("/register", registerUser);

//google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),googleLogin
);



router.get("/home",requireLogin, loadHome);

export default router;
