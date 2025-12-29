import {
  registerUserService,
  verifySignUpOtpService,
  resendOtpService,
  loginUserService,
  sendRecoverOtpService,
  verifyRecoveryOtpService,
  resetPasswordService,
} from "./auth.service.js";

import { HttpStatus } from "../../shared/constants/statusCode.js";
import { UserAuthMessages } from "../../shared/constants/messages/userAuthMessages.js";
import {
  userRegisterSchema,
  userLoginSchema,
  resetPasswordSchema,
} from "./auth.validator.js";
import { getWishlistItemsCount } from "../wishlist/wishlist.repo.js";
import { getCartItemsCount } from "../cart/cart.repo.js";
import { AppError } from "../../shared/utils/app.error.js";

/* ----------------------------------------------------
   LOAD VIEWS
---------------------------------------------------- */
export const loadSignUp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/signUp", {
    pageTitle: "Sign Up",
    pageJs: "signUp",
  });

export const loadLogin = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/login", {
    pageTitle: "Login",
    pageJs: "login",
  });

export const loadVerifyOtp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/verifyOtp", {
    pageTitle: "Verify OTP",
    pageJs: "verifyOtp",
    otpCooldownEnd: req.session.otpCooldownEnd || null,
  });

export const loadForgotPassword = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/forgotPassword", {
    pageTitle: "Forgot Password",
    pageJs: "forgotPassword",
  });

export const loadRecoverOtp = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/verifyOtp", {
    pageTitle: "Verify OTP",
    pageJs: "recoverOtp",
    otpCooldownEnd: req.session.otpCooldownEnd || null,
  });

export const loadResetPassword = (req, res) =>
  res.status(HttpStatus.OK).render("user/auth/resetPassword", {
    pageTitle: "Reset Password",
    pageJs: "resetPassword",
  });

/* ----------------------------------------------------
   SIGN UP
---------------------------------------------------- */
export const registerUser = async (req, res) => {
  const { error } = userRegisterSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await registerUserService(req.body, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    redirect: "/verifyOtp",
    message: UserAuthMessages.SIGNUP_OTP_SENT,
  });
};

/* ----------------------------------------------------
   VERIFY SIGNUP OTP
---------------------------------------------------- */
export const verifyOtp = async (req, res) => {
  await verifySignUpOtpService(req.body.otp, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    redirect: "/login",
    message: UserAuthMessages.OTP_VERIFIED,
  });
};

/* ----------------------------------------------------
   RESEND OTP
---------------------------------------------------- */
export const resendOtp = async (req, res) => {
  await resendOtpService(req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserAuthMessages.OTP_RESENT,
    cooldownSeconds: req.session.otpCooldownEnd,
  });
};

/* ----------------------------------------------------
   LOGIN
---------------------------------------------------- */
export const loginUser = async (req, res, next) => {
  const { error } = userLoginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const user = await loginUserService(req.body.email, req.body.password);

  req.login(user, async (err) => {
    if (err) return next(err);

    req.session.wishlistCount = await getWishlistItemsCount(user._id);
    req.session.cartCount = await getCartItemsCount(user._id);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/home",
      message: UserAuthMessages.LOGGED_IN,
    });
  });
};

/* ----------------------------------------------------
   SEND RECOVERY OTP
---------------------------------------------------- */
export const sendRecoverOtp = async (req, res) => {
  await sendRecoverOtpService(req.body.email, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    redirect: "/verifyRecoverOtp",
    message: UserAuthMessages.SIGNUP_OTP_SENT,
  });
};

/* ----------------------------------------------------
   VERIFY RECOVERY OTP
---------------------------------------------------- */
export const verifyRecoverOtp = async (req, res) => {
  await verifyRecoveryOtpService(req.body.otp, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    redirect: "/resetPassword",
    message: UserAuthMessages.OTP_VERIFIED,
  });
};

/* ----------------------------------------------------
   RESET PASSWORD
---------------------------------------------------- */
export const saveNewPassword = async (req, res) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await resetPasswordService(req.body.password, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    redirect: "/login",
    message: UserAuthMessages.LOGGED_OUT,
  });
};

/* ----------------------------------------------------
   LOGOUT
---------------------------------------------------- */
export const logOutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie("user.sid");

      res.status(HttpStatus.OK).json({
        success: true,
        message: UserAuthMessages.LOGGED_OUT,
        redirect: "/login",
      });
    });
  });
};

/* ----------------------------------------------------
   GOOGLE LOGIN
---------------------------------------------------- */
export const googleLogin = async (req, res) => {
  if (typeof req.session.wishlistCount !== "number") {
    req.session.wishlistCount = await getWishlistItemsCount(req.user._id);
  }

  if (typeof req.session.cartCount !== "number") {
    req.session.cartCount = await getCartItemsCount(req.user._id);
  }

  req.session.toast = {
    type: "success",
    message: UserAuthMessages.LOGIN_SUCCESS_TOAST,
  };

  res.redirect("/home");
};
