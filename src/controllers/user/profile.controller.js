import { sendVerificationEmail } from "../../helpers/gmail.js";
import { generateOtp } from "../../helpers/otp.js";
import { passwordSchema } from "../../validators/changePasswordValidator.js";
import userModel from "../../models/userModel.js";
import bcrypt from "bcrypt";
import { usernameValidator } from "../../validators/usernameValidator.js";
import { emailSchema } from "../../validators/editEmailValidator.js";
import { otpSchema } from "../../validators/sendOtpToemailValidator.js";

export const loadPersonalInfo = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);
    res.render("user/personalInfo", {
      pageTitle: "Personal Information",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const loadEditInfo = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);
    res.render("user/editInfo", {
      pageTitle: "Personal Information",
      user,
      pageJs: "editInfo",
    });
  } catch (error) {
    next(error);
  }
};

export const editInfo = async (req, res) => {
  try {
    const { error } = usernameValidator.validate(req.body);
    if (error) {
      if (req.file) {
        const fs = await import("fs");
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username } = req.body;
    const removePhoto = req.body.removePhoto ? req.body.removePhoto : false;
    const avatar = req.file ? `/uploads/user/${req.file.filename}` : null;

    const user = await userModel.findById(req.session.user);

    if (removePhoto && !avatar) {
      user.avatar = "/images/user-avatar.svg";
    } else if (avatar) {
      user.avatar = avatar;
    }

    user.username = username;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Your personal details have been updated!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loadEditEmail = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);
    res.render("user/editEmail", {
      pageTitle: "Personal Information",
      user,
      pageJs: "editEmail",
    });
  } catch (error) {
    console.error("Error fetching edit Email", error);
    next(error);
  }
};

export const editEmail = async (req, res) => {
  try {
    console.log(req.body)
    const { error } = emailSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newEmail = req.body.newEmail;
    const existUser = await userModel.findOne({ email: newEmail });
    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const otp = generateOtp();
    req.session.oldEmail = req.body.oldEmail;
    req.session.newEmail = newEmail;
    const sentEmail = await sendVerificationEmail(newEmail, otp);
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
      message: "Check your inbox! We’ve sent a 6-digit OTP to your email.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

export const sendOtpToEditEmail = async (req, res) => {
  try {
    const { error } = otpSchema.validate(req.body);
    const { otp } = req.body;
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    if (!req.session.otp || !req.session.oldEmail || !req.session.newEmail) {
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

    const user = await userModel.findOne({ email: req.session.oldEmail });
    user.email = req.session.newEmail;
    await user.save();

    req.session.oldEmail = null;
    req.session.newEmail = null;
    req.session.otp = null;
    req.session.otpExpiry = null;
    return res.json({
      success: true,
      message: "OTP verified successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

export const reSendOtpToEditEmail = async (req, res) => {
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
    if (!req.session.oldEmail || !req.session.newEmail) {
      return res.json({
        success: false,
        message: "No user data found. Please signup again.",
      });
    }

    const { newEmail } = req.session;

    const sentEmail = await sendVerificationEmail(newEmail, otp);

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
      message: `A new OTP has been sent to ${newEmail} .`,
    });
  } catch (error) {
    console.error("Error fetching edit Email", error);
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const loadChangePassword = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);
    res.render("user/changePasswod", {
      pageTitle: "Change Password",
      user,
      pageJs: "changePassword",
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { error } = passwordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { currentPassword, newPassword, userId } = req.body;
    const user = await userModel.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password does not match." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error update password", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
