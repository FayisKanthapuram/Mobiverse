import express from "express";
import passport from "passport";
import {
  loadSignUp,
  registerUser,
  loadLogin,
  googleLogin,
  loginUser,
  loadVerifyOtp,
  verifyOtp,
  resendOtp,
  loadForgotPassword,
  loadResetPassword,
  sendRecoverOtp,
  verifyRecoverOtp,
  loadRecoverOtp,
  saveNewPassword,
  logOutUser,
} from "./auth.controller.js";
import {
  isLogin,
  isResetPass,
  isVerifyOtp,
  isVerifyRecoveryOtp,
  requireLogin,
} from "../../shared/middlewares/userAuth.js";
import nocache from "nocache";

const router = express.Router();

router.use(nocache());

// Auth routes - user authentication endpoints
router.get("/login", isLogin, loadLogin);
router.post("/login", isLogin, loginUser);

// forgot-password
router.get("/forgotPassword", isLogin, loadForgotPassword);
router.post("/forgotPassword", isLogin, sendRecoverOtp);
router.get("/verifyRecoverOtp", isLogin, isVerifyRecoveryOtp, loadRecoverOtp);
router.post("/verifyRecoverOtp",isLogin, verifyRecoverOtp);
router.get("/resetPassword", isResetPass, loadResetPassword);
router.post("/resetPassword",isLogin, saveNewPassword);

// signup
router.get("/signup", isLogin, loadSignUp);
router.post("/register",isLogin, registerUser);
router.get("/verifyOtp", isVerifyOtp, loadVerifyOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);

// google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),requireLogin,
  googleLogin
);

// logout
router.post("/logout", logOutUser);

export default router;
