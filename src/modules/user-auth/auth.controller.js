import bcrypt from "bcrypt";
import User from "../user/user.model.js";
import { generateOtp } from "../../helpers/otp.js";
import { sendVerificationEmail } from "../../helpers/gmail.js";
import { resetPasswordSchema, userLoginSchema, userRegisterSchema } from "../../validators/authUserValidator.js";
import walletModel from "../../models/walletModel.js";

export const loadSignUp = (req, res,next) => {
  try {
    res.render("user/signUp", {
      pageTitle: "Sign Up",
      pageJs: "signUp",
    });
  } catch (error) {
    next(error)
  }
};

export const loadLogin = (req, res,next) => {
  try {
    res.render("user/login", {
      pageTitle: "login",
      pageJs: "login",
    });
  } catch (error) {
    next(error)
  }
};

export const registerUser = async (req, res) => {
  try {
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    req.session.tempUser = { username, email, password: hashedPassword };
    const otp = generateOtp();
    const sentEmail = await sendVerificationEmail(email, otp);
    if (!sentEmail) {
      return res.status(400).json({
        success: false,
        message: "Failed to send OTP,try again later.",
      });
    }
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 1 * 60 * 1000;
    console.log(otp);
    return res.status(200).json({
      success: true,
      redirect: "/verifyOtp",
      message: "Check your inbox! We’ve sent a 6-digit OTP to your email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loadVerifyOtp = (req, res,next) => {
  try {
    res.render("user/verifyOtp", {
      pageTitle: "Verify Otp",
      pageJs: "verifyOtp",
    });
  } catch (error) {
    next(error)
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!req.session.otp || !req.session.tempUser) {
      return res.status(401).json({
        success: false,
        message: "OTP not found. Please signup again.",
      });
    }
    if (Date.now() > req.session.otpExpiry) {
      req.session.otp = null;
      req.session.otpExpiry = null;
      return res.status(401).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }
    if (otp !== req.session.otp) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect OTP. Try again." });
    }

    const user=await User.create(req.session.tempUser);
    console.log(user);
    if(user){
      await walletModel.create({userId:user._id});
    }

    req.session.tempUser = null;
    req.session.otp = null;
    req.session.otpExpiry = null;

    return res.json({
      success: true,
      message: "OTP verified successfully!",
      redirect: "/login",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// resend otp

export const resendOtp = async (req, res) => {
  try {
    const now = Date.now();
    const lastSend = req.session.lastOtpSent || 0;

    const diff = (now - lastSend) / 1000;

    if (diff < 30) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(
          30 - diff
        )} seconds before requesting again`,
      });
    }

    req.session.lastOtpSent = now;

    const otp = generateOtp();
    req.session.otp = otp;
    if (!req.session.tempUser) {
      return res.json({
        success: false,
        message: "No user data found. Please signup again.",
      });
    }

    const email = req.session.tempUser.email;

    const sentEmail = await sendVerificationEmail(email, otp);

    if (!sentEmail) {
      return res.json({
        success: false,
        message: "Failed to resend OTP. Try again later.",
      });
    }

    req.session.otpExpiry = Date.now() + 1 * 60 * 1000;
    console.log("resend otp", otp);
    return res.json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong while resending OTP.",
    });
  }
};

export const googleLogin = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/signup");
    }

    if (req.user.isBlocked) {
      return res.redirect("/login?error=blocked");
    }

    req.session.user = req.user._id;
    return res.redirect("/home?message=login-success");
  } catch (err) {
    console.log(err);
    return res.redirect("/signup");
  }
};

export const loginUser = async (req, res) => {
  try {
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not found" });
    }
    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message:
          "Your account is currently blocked. Please contact the admin for assistance.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }
    req.session.user = user._id;
    res.json({
      success: true,
      message: "User log in successfully",
      redirect: "/home",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//forgot password
export const loadForgotPassword = (req, res,next) => {
  try {
    res.render("user/forgotPassword", {
      pageTitle: "Forgot Password",
      pageJs: "forgotPassword",
    });
  } catch (error) {
    next(error)
  }
};

export const sendRecoverOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({ success: false, message: "email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log;
      return res.status(400).json({
        success: false,
        message: "No account found with this email",
      });
    }
    if (!user.password) {
      console.log("user.password");
      return res.status(400).json({
        success: false,
        message: "Password change is not available for Google users",
      });
    }
    const otp = generateOtp();
    const sentEmail = await sendVerificationEmail(email, otp);
    if (!sentEmail) {
      return res.status(400).json({
        success: false,
        message: "Failed to send OTP,try again later.",
      });
    }
    req.session.recoveryOtp = otp;
    req.session.recoveryOtpExpiry = Date.now() + 1 * 60 * 1000;
    req.session.recoverEmail = email;
    console.log(otp);
    return res.json({
      success: true,
      redirect: "/verifyRecoverOtp",
      message: "Check your inbox! We’ve sent a 6-digit OTP to your email.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loadRecoverOtp = (req, res,next) => {
  try {
    res.render("user/verifyOtp", {
      pageTitle: "Verify Otp",
      pageJs: "recoverOtp",
    });
  } catch (error) {
    next(error)
  }
};

export const verifyRecoverOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp, "registered");
    if (!req.session.recoveryOtp || !req.session.recoveryOtpExpiry) {
      return res.status(401).json({
        success: false,
        message: "OTP not found. Please signup again.",
      });
    }
    if (Date.now() > req.session.recoveryOtpExpiry) {
      req.session.recoveryOtp = null;
      req.session.recoveryOtpExpiry = null;
      return res.status(401).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }
    if (otp !== req.session.recoveryOtp) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect OTP. Try again." });
    }
    req.session.recoveryOtp = null;
    req.session.recoveryOtpExpiry = null;
    req.session.resetPass = true;
    return res.json({
      success: true,
      message: "OTP verified successfully!",
      redirect: "/resetPassword",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loadResetPassword = (req, res,next) => {
  try {
    res.render("user/resetPassword", {
      pageTitle: "Reset Password",
      pageJs: "resetPassword",
    });
  } catch (error) {
    next(error);
  }
};

export const saveNewPassword = async (req, res) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    if (!req.session.recoverEmail) {
      return res.status(400).json({
        success: false,
        message: "User is not found",
        redirect: "/forgotPassword",
      });
    }
    const user = await User.findOne({ email: req.session.recoverEmail });
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    req.session.resetPass = false;

    return res.status(200).json({
      success: true,
      redirect: "/login",
      message: "Your password has been reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const logOutUser = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("user.sid");

    res.redirect("/login?error=logout");
  });
};
