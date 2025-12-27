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
import {
  userRegisterSchema,
  userLoginSchema,
  resetPasswordSchema,
} from "./auth.validator.js";
import { getWishlistItemsCount } from "../wishlist/wishlist.repo.js";
import { getCartItemsCount } from "../cart/cart.repo.js";

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
   SIGNUP
---------------------------------------------------- */
export const registerUser = async (req, res, next) => {
  try {
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    await registerUserService(req.body, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/verifyOtp",
      message: "OTP sent to email",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   VERIFY SIGNUP OTP
---------------------------------------------------- */
export const verifyOtp = async (req, res, next) => {
  try {
    await verifySignUpOtpService(req.body.otp, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/login",
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   RESEND OTP
---------------------------------------------------- */
export const resendOtp = async (req, res, next) => {
  try {
    await resendOtpService(req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   LOGIN
---------------------------------------------------- */
export const loginUser = async (req, res, next) => {
  try {
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await loginUserService(req.body.email, req.body.password);
    req.login(user, async (err) => {
      if (err) return next(err);
      req.session.wishlistCount = await getWishlistItemsCount(user._id);
      req.session.cartCount = await getCartItemsCount(user._id);

      res.status(HttpStatus.OK).json({
        success: true,
        redirect: "/home",
        message: "Logged in successfully",
      });
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   SEND RECOVERY OTP
---------------------------------------------------- */
export const sendRecoverOtp = async (req, res, next) => {
  try {
    await sendRecoverOtpService(req.body.email, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/verifyRecoverOtp",
      message: "OTP sent to email",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   VERIFY RECOVERY OTP
---------------------------------------------------- */
export const verifyRecoverOtp = async (req, res, next) => {
  try {
    await verifyRecoveryOtpService(req.body.otp, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/resetPassword",
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   RESET PASSWORD
---------------------------------------------------- */
export const saveNewPassword = async (req, res, next) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    await resetPasswordService(req.body.password, req.session);

    res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/login",
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------------------------------
   LOGOUT
---------------------------------------------------- */
export const logOutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie("user.sid");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
        redirect: "/login",
      });
    });
  });
};

/* ----------------------------------------------------
   GOOGLE LOGIN
---------------------------------------------------- */
export const googleLogin = async (req, res, next) => {
  try {
    if (typeof req.session.wishlistCount !== "number") {
      req.session.wishlistCount = await getWishlistItemsCount(req.user._id);
    }

    if (typeof req.session.cartCount !== "number") {
      req.session.cartCount = await getCartItemsCount(req.user._id);
    }

    req.session.toast = {
      type: "success",
      message: "Login successful",
    };

    return res.redirect("/home");
  } catch (error) {
    next(error);
  }
};
