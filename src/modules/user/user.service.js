import bcrypt from "bcrypt";
import { findUserByEmail, findUserById, saveUser } from "./user.repo.js";
import { cloudinaryUpload } from "../../shared/middlewares/upload.js";
import cloudinary from "../../config/cloudinary.js";
import { DEFAULT_USER_AVATAR } from "../../shared/constants/assets.js";
import { createOtp, sendOtpEmail } from "../user-auth/auth.helper.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";

// User service - profile and account operations
// Fetch user profile by id
export const getUserProfileService = async (userId) => {
  return await findUserById(userId).populate("referredBy");
};

// Update username and avatar
export const updateUserInfoService = async (
  userId,
  username,
  avatar,
  remove
) => {
  const user = await findUserById(userId);

  if (remove && !avatar) {
    if (user.avatar) {
      const publicId = user.avatar.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/user/${publicId}`);
    }
    user.avatar = DEFAULT_USER_AVATAR;
  } else if (avatar) {
    if (user.avatar) {
      const publicId = user.avatar.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/user/${publicId}`);
    }
    const result = await cloudinaryUpload(avatar, "user");
    user.avatar = result.secure_url;
  }

  user.username = username;
  await saveUser(user);
  return true;
};
// Initiate email change by sending OTP
export const requestEmailChangeService = async (
  oldEmail,
  newEmail,
  session
) => {
  const existUser = await findUserByEmail(newEmail);
  if (existUser) {
    throw new AppError(UserMessages.USER_ALREADY_EXISTS_EMAIL, HttpStatus.CONFLICT);
  }

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(newEmail, otp, "changeEmail");
  if (!sent) throw new AppError(UserMessages.FAILED_SEND_OTP, HttpStatus.INTERNAL_SERVER_ERROR);
  console.log("Change Email OTP: ",otp)

  session.oldEmail = oldEmail;
  session.newEmail = newEmail;
  session.otp = otp;
  session.otpExpiry = expiry;

  return true;
};
// Verify OTP and update email
export const verifyEmailOtpService = async (otp, session) => {
  if (!session.otp || !session.oldEmail || !session.newEmail) {
    throw new AppError(UserMessages.OTP_NOT_FOUND, HttpStatus.BAD_REQUEST);
  }

  if (Date.now() > session.otpExpiry) throw new AppError(UserMessages.OTP_EXPIRED, HttpStatus.BAD_REQUEST);
  if (otp !== session.otp) throw new AppError(UserMessages.INCORRECT_OTP, HttpStatus.BAD_REQUEST);

  const user = await findUserByEmail(session.oldEmail);
  user.email = session.newEmail;
  await saveUser(user);

  session.oldEmail = null;
  session.newEmail = null;
  session.otp = null;
  session.otpExpiry = null;

  return true;
};
// Resend email change OTP
export const resendEmailOtpService = async (session) => {
  if (!session.newEmail) throw new AppError(UserMessages.USER_DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

  const { otp, expiry } = createOtp();
  const sent = await sendOtpEmail(session.newEmail, otp, "resendChangeEmail");
  if (!sent) throw new AppError(UserMessages.FAILED_RESEND_OTP, HttpStatus.INTERNAL_SERVER_ERROR);
  console.log("Change Email Resend OTP: ", otp);

  session.otp = otp;
  session.otpExpiry = expiry;

  return true;
};
// Update user password after verifying current password
export const updatePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await findUserById(userId);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError(UserMessages.CURRENT_PASSWORD_MISMATCH, HttpStatus.BAD_REQUEST);

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await saveUser(user);

  return true;
};
