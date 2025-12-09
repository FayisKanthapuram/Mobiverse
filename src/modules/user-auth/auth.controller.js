import {
  registerUserService,
  verifySignUpOtpService,
  resendOtpService,
  loginUserService,
  sendRecoverOtpService,
  verifyRecoveryOtpService,
  resetPasswordService,
  googleLoginService,
} from "./auth.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

import {
  userRegisterSchema,
  userLoginSchema,
  resetPasswordSchema
} from "./auth.validator.js";

// LOAD VIEWS
export const loadSignUp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/signUp", { pageTitle: "Sign Up", pageJs: "signUp" });

export const loadLogin = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/login", { pageTitle: "Login", pageJs: "login" });

// SIGNUP
export const registerUser = async (req, res) => {
  try {
    const { error } = userRegisterSchema.validate(req.body);
    if (error)
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    await registerUserService(req.body, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/verifyOtp",
      message: "OTP sent to email",
    });
  } catch (err) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
  }
};

export const loadVerifyOtp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/verifyOtp", { pageTitle: "Verify Otp", pageJs: "verifyOtp" });

export const verifyOtp = async (req, res) => {
  try {
    await verifySignUpOtpService(req.body.otp, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/login",
      message: "OTP verified successfully!",
    });
  } catch (err) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
  }
};

// RESEND OTP
export const resendOtp = async (req, res) => {
  try {
    await resendOtpService(req.session);

    res.status(HttpStatus.OK).json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { error } = userLoginSchema.validate(req.body);
    if (error)
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const user = await loginUserService(req.body.email, req.body.password);

    req.session.user = user._id;

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/home",
      message: "Logged in successfully",
    });
  } catch (err) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: err.message });
  }
};

// FORGOT PASSWORD
export const loadForgotPassword = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/forgotPassword", { pageTitle: "Forgot Password", pageJs: "forgotPassword" });

export const sendRecoverOtp = async (req, res) => {
  try {
    await sendRecoverOtpService(req.body.email, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/verifyRecoverOtp",
      message: "OTP sent to email",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// VERIFY RECOVERY OTP
export const loadRecoverOtp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/verifyOtp", { pageTitle: "Verify OTP", pageJs: "recoverOtp" });

export const verifyRecoverOtp = async (req, res) => {
  try {
    await verifyRecoveryOtpService(req.body.otp, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/resetPassword",
      message: "OTP verified successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// RESET PASSWORD
export const loadResetPassword = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/resetPassword", { pageTitle: "Reset Password", pageJs: "resetPassword" });

export const saveNewPassword = async (req, res) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.details[0].message });

    await resetPasswordService(req.body.password, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/login",
      message: "Password reset successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// LOGOUT
export const logOutUser = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("user.sid");
    res.redirect("/login?error=logout");
  });
};

export const googleLogin = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/signup");
    }

    const userId = await googleLoginService(req.user);

    req.session.user = userId;

    return res.redirect("/home?message=login-success");
  } catch (error) {
    console.log(error);
    return res.redirect("/login?error=google-auth-failed");
  }
};
