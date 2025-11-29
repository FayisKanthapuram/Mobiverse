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
} from "../../controllers/user/auth.controller.js";
import {
  isLogin,
  isResetPass,
  isVerifyOtp,
  isVerifyRecoveryOtp,
} from "../../middlewares/userAuth.js";

const router = express.Router();

// auth routes
router.get("/login", isLogin, loadLogin);
router.post("/login", loginUser);

// forgot-password
router.get("/forgotPassword", isLogin, loadForgotPassword);
router.post("/forgotPassword", sendRecoverOtp);
router.get("/verifyRecoverOtp", isVerifyRecoveryOtp, loadRecoverOtp);
router.post("/verifyRecoverOtp", verifyRecoverOtp);
router.get("/resetPassword", isResetPass, loadResetPassword);
router.post("/resetPassword", saveNewPassword);

// signup
router.get("/signup", isLogin, loadSignUp);
router.post("/register", registerUser);
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
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
  googleLogin
);

// logout
router.get("/logout", logOutUser);

export default router;
