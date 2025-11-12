import express from "express";
import setLayout from "../middlewares/setLayout.js";
const router = express.Router();
import passport from "passport";

import { getProductDetails, loadBrands, loadHome } from "../controllers/user/userController.js";
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
} from "../controllers/user/authController.js";
import { isLogin, isResetPass, isVerifyOtp, isVerifyRecoveryOtp, requireLogin } from "../middlewares/userAuth.js";

router.use(setLayout("user"));

//login
router.get("/login", isLogin, loadLogin);
router.post("/login", loginUser);

//forgot-password
router.get("/forgotPassword",isLogin,loadForgotPassword);
router.post('/forgotPassword',sendRecoverOtp);
router.get('/verifyRecoverOtp',isVerifyRecoveryOtp,loadRecoverOtp)
router.post('/verifyRecoverOtp',verifyRecoverOtp)
router.get("/resetPassword",isResetPass,loadResetPassword);
router.post('/resetPassword',saveNewPassword);

//signup
router.get("/signup", isLogin, loadSignUp);
router.post("/register", registerUser);
router.get("/verifyOtp",isVerifyOtp, loadVerifyOtp);
router.post("/verifyOtp", verifyOtp);
router.post('/resendOtp',resendOtp);

//google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
  googleLogin
);

router.get("/home", requireLogin, loadHome);
router.get('/brands',loadBrands);
router.get('/hello',getProductDetails);

export default router;
