import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  getUserProfileService,
  updateUserInfoService,
  requestEmailChangeService,
  verifyEmailOtpService,
  resendEmailOtpService,
  updatePasswordService,
} from "./user.service.js";

import { usernameValidator } from "./validators/username.validator.js";
import { emailSchema } from "./validators/edit.email.validator.js";
import { otpSchema } from "./validators/otp.validator.js";
import { passwordSchema } from "./validators/change.password.validator.js";

// Load views
export const loadPersonalInfo = async (req, res, next) => {
  try {
    const user = await getUserProfileService(req?.user?._id);
    res.status(HttpStatus.OK).render("user/user/personalInfo", { pageTitle: "Personal Information", user });
  } catch (error) {
    next(error);
  }
};

export const loadEditInfo = async (req, res, next) => {
  try {
    res.status(HttpStatus.OK).render("user/user/editInfo", {
      pageTitle: "Edit Info",
      pageJs: "editInfo",
    });
  } catch (error) {
    next(error);
  }
};

// Update info
export const editInfo = async (req, res) => {
  try {
    const { error } = usernameValidator.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });
    }

    const avatar = req.file ? req.file.buffer : null;

    await updateUserInfoService(
      req?.user?._id,
      req.body.username,
      avatar,
      req.body.removePhoto
    );

    res.status(HttpStatus.OK).json({ success: true, message: "Personal info updated!" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Edit Email UI
export const loadEditEmail = async (req, res, next) => {
  try {
    res.status(HttpStatus.OK).render("user/user/editEmail", {
      pageTitle: "Edit Email",
      pageJs: "editEmail",
    });
  } catch (error) {
    next(error);
  }
};

// Request OTP for email
export const editEmail = async (req, res) => {
  try {
    const { error } = emailSchema.validate(req.body);
    if (error) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    await requestEmailChangeService(req.body.oldEmail, req.body.newEmail, req.session);

    res.status(HttpStatus.OK).json({ success: true, message: "OTP sent to your email!" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify OTP
export const sendOtpToEditEmail = async (req, res) => {
  try {
    const { error } = otpSchema.validate(req.body);
    if (error) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    await verifyEmailOtpService(req.body.otp, req.session);

    res.status(HttpStatus.OK).json({ success: true, message: "OTP verified!" });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Resend OTP
export const reSendOtpToEditEmail = async (req, res) => {
  try {
    await resendEmailOtpService(req.session);
    res.status(HttpStatus.OK).json({ success: true, message: "New OTP sent!" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Change password
export const loadChangePassword = async (req, res, next) => {
  try {
    res.status(HttpStatus.OK).render("user/user/changePasswod", {
      pageTitle: "Change Password",
      pageJs: "changePassword",
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { error } = passwordSchema.validate(req.body);
    if (error) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    await updatePasswordService(req.body.userId, req.body.currentPassword, req.body.newPassword);

    res.status(HttpStatus.OK).json({ success: true, message: "Password updated!" });
  } catch (error) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.message });
  }
};
