import express from "express";
import setLayout from "../middlewares/setLayout.js";
const router = express.Router();
import passport from "passport";

import {
  loadPersonalInfo,
  loadShop,
  loadHome,
  loadProductDetails,
  loadEditInfo,
  loadEditEmail,
  editInfo,
  loadChangePassword,
  editEmail,
  sendOtpToEditEmail,
  reSendOtpToEditEmail,
} from "../controllers/user/userController.js";
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
import {
  isBlocked,
  isLogin,
  isResetPass,
  isVerifyOtp,
  isVerifyRecoveryOtp,
  requireLogin,
} from "../middlewares/userAuth.js";
import upload from "../middlewares/upload.js";

router.use(setLayout("user"));

//login
router.get("/login", isLogin, loadLogin);
router.post("/login", loginUser);

//forgot-password
router.get("/forgotPassword", isLogin, loadForgotPassword);
router.post("/forgotPassword", sendRecoverOtp);
router.get("/verifyRecoverOtp", isVerifyRecoveryOtp, loadRecoverOtp);
router.post("/verifyRecoverOtp", verifyRecoverOtp);
router.get("/resetPassword", isResetPass, loadResetPassword);
router.post("/resetPassword", saveNewPassword);

//signup
router.get("/signup", isLogin, loadSignUp);
router.post("/register", registerUser);
router.get("/verifyOtp", isVerifyOtp, loadVerifyOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);

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

router.get("/home", isBlocked, loadHome);
router.get("/shop", isBlocked, loadShop);
router.get("/personal-info", requireLogin, isBlocked, loadPersonalInfo);
router.get("/edit-info", requireLogin, isBlocked, loadEditInfo);
router.patch("/edit-info", upload.user.single("profilePicture"), editInfo);
router.get("/edit-email", requireLogin, isBlocked, loadEditEmail);
router.post("/edit-email", editEmail);
router.post("/edit-email/otp", sendOtpToEditEmail);
router.post("/edit-email/resend-otp", reSendOtpToEditEmail);
router.get("/change-password", requireLogin, isBlocked, loadChangePassword);

router.get("/product/:variantId", loadProductDetails);

export default router;
