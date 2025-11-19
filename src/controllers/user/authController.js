import bcrypt from "bcrypt";
import User from "../../models/userModel.js";
import Joi from "joi";
import { generateOtp } from "../../helpers/otp.js";
import { sendVerificationEmail } from "../../helpers/gmail.js";

export const loadSignUp = (req, res) => {
  res.render("user/signUp", {
    pageTitle: "Sign Up",
    pageCss: "auth",
    pageJs: "signUp",
  });
};

export const loadLogin = (req, res) => {
  res.render("user/login", {
    pageTitle: "login",
    pageCss: "auth",
    pageJs: "login",
  });
};

export const registerUser = async (req, res) => {
  try {
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(3).max(30).required().messages({
        "string.empty": "Username is required",
        "string.min": "Username must be at least 3 characters",
        "string.max": "Username cannot be more than 30 characters",
      }),

      email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email",
        "string.empty": "Email is required",
      }),

      password: Joi.string()
        .pattern(
          new RegExp(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"
          )
        )
        .required()
        .messages({
          "string.empty": "Password is required",
          "string.pattern.base":
            "Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character",
        }),

      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
          "string.empty": "Confirm password is required",
        }),
    });
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

export const loadVerifyOtp = (req, res) => {
  res.render("user/verifyOtp", {
    pageTitle: "Verify Otp",
    pageCss: "auth",
    pageJs: "verifyOtp",
  });
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

    await User.create(req.session.tempUser);

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
    return res.redirect("/home");
  } catch (err) {
    console.log(err);
    return res.redirect("/signup");
  }
};

export const loginUser = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email",
        "string.empty": "Email is required",
      }),
      password: Joi.string().min(4).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 4 characters",
      }),
    });
    const { error } = schema.validate(req.body);
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
export const loadForgotPassword = (req, res) => {
  res.render("user/forgotPassword", {
    pageTitle: "Forgot Password",
    pageCss: "auth",
    pageJs: "forgotPassword",
  });
};

export const sendRecoverOtp = async (req, res) => {
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
};

export const loadRecoverOtp = (req, res) => {
  res.render("user/verifyOtp", {
    pageTitle: "Verify Otp",
    pageCss: "auth",
    pageJs: "recoverOtp",
  });
};

export const verifyRecoverOtp = async (req, res) => {
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
};

export const loadResetPassword = (req, res) => {
  res.render("user/resetPassword", {
    pageTitle: "Reset Password",
    pageCss: "auth",
    pageJs: "resetPassword",
  });
};

export const saveNewPassword = async (req, res) => {
  try {
    const userRegisterSchema = Joi.object({
      password: Joi.string().min(6).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
      }),

      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
          "string.empty": "Confirm password is required",
        }),
    });
    const { error } = userRegisterSchema.validate(req.body);
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
    res.status(500).json({ success: false, message: "Server error" });
  }
};
