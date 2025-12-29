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
import { AppError } from "../../shared/utils/app.error.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";

/* ----------------------------------------------------
   LOAD PERSONAL INFO
---------------------------------------------------- */
export const loadPersonalInfo = async (req, res) => {
  const user = await getUserProfileService(req.user._id);

  res.status(HttpStatus.OK).render("user/user/personalInfo", {
    pageTitle: "Personal Information",
    user,
  });
};

/* ----------------------------------------------------
   LOAD EDIT INFO
---------------------------------------------------- */
export const loadEditInfo = async (req, res) => {
  res.status(HttpStatus.OK).render("user/user/editInfo", {
    pageTitle: "Edit Info",
    pageJs: "editInfo",
  });
};

/* ----------------------------------------------------
   UPDATE USER INFO
---------------------------------------------------- */
export const editInfo = async (req, res) => {
  const { error } = usernameValidator.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const avatar = req.file ? req.file.buffer : null;

  await updateUserInfoService(
    req.user._id,
    req.body.username,
    avatar,
    req.body.removePhoto
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserMessages.PERSONAL_INFO_UPDATED,
    redirect: "/personal-info",
  });
};

/* ----------------------------------------------------
   LOAD EDIT EMAIL
---------------------------------------------------- */
export const loadEditEmail = async (req, res) => {
  res.status(HttpStatus.OK).render("user/user/editEmail", {
    pageTitle: "Edit Email",
    pageJs: "editEmail",
  });
};

/* ----------------------------------------------------
   REQUEST EMAIL CHANGE (SEND OTP)
---------------------------------------------------- */
export const editEmail = async (req, res) => {
  const { error } = emailSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await requestEmailChangeService(
    req.body.oldEmail,
    req.body.newEmail,
    req.session
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserMessages.OTP_SENT,
  });
};

/* ----------------------------------------------------
   VERIFY EMAIL OTP
---------------------------------------------------- */
export const sendOtpToEditEmail = async (req, res) => {
  const { error } = otpSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await verifyEmailOtpService(req.body.otp, req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserMessages.OTP_VERIFIED,
  });
};

/* ----------------------------------------------------
   RESEND EMAIL OTP
---------------------------------------------------- */
export const reSendOtpToEditEmail = async (req, res) => {
  await resendEmailOtpService(req.session);

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserMessages.NEW_OTP_SENT,
  });
};

/* ----------------------------------------------------
   LOAD CHANGE PASSWORD
---------------------------------------------------- */
export const loadChangePassword = async (req, res) => {
  res.status(HttpStatus.OK).render("user/user/changePasswod", {
    pageTitle: "Change Password",
    pageJs: "changePassword",
  });
};

/* ----------------------------------------------------
   UPDATE PASSWORD
---------------------------------------------------- */
export const updatePassword = async (req, res) => {
  const { error } = passwordSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await updatePasswordService(
    req.body.userId,
    req.body.currentPassword,
    req.body.newPassword
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserMessages.PASSWORD_UPDATED,
    redirect: "/personal-info",
  });
};
