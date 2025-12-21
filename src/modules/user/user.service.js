import bcrypt from "bcrypt";
import { findUserByEmail, findUserById, saveUser } from "./user.repo.js";
import { cloudinaryUpload } from "../../shared/middlewares/upload.js";
import cloudinary from "../../config/cloudinary.js";
import { DEFAULT_USER_AVATAR } from "../../shared/constants/assets.js";
import { createOtp, sendOtpEmail } from "../user-auth/auth.helper.js";

export const getUserProfileService = async (userId) => {
  return await findUserById(userId);
};

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

export const requestEmailChangeService = async (
  oldEmail,
  newEmail,
  session
) => {
  const existUser = await findUserByEmail(newEmail);
  if (existUser) {
    throw new Error("User already exist with this email");
  }

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(newEmail, otp, "changeEmail");
  if (!sent) throw new Error("Failed to send OTP");

  session.oldEmail = oldEmail;
  session.newEmail = newEmail;
  session.otp = otp;
  session.otpExpiry = expiry;

  return true;
};

export const verifyEmailOtpService = async (otp, session) => {
  if (!session.otp || !session.oldEmail || !session.newEmail) {
    throw new Error("OTP not found");
  }

  if (Date.now() > session.otpExpiry) throw new Error("OTP expired");
  if (otp !== session.otp) throw new Error("Incorrect OTP");

  const user = await findUserByEmail(session.oldEmail);
  user.email = session.newEmail;
  await saveUser(user);

  session.oldEmail = null;
  session.newEmail = null;
  session.otp = null;
  session.otpExpiry = null;

  return true;
};

export const resendEmailOtpService = async (session) => {
  if (!session.newEmail) throw new Error("User data not found");

  const { otp, expiry } = createOtp();
  const sent = await sendOtpEmail(session.newEmail, otp, "resendChangeEmail");
  if (!sent) throw new Error("Failed to resend OTP");

  session.otp = otp;
  session.otpExpiry = expiry;

  return true;
};

export const updatePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await findUserById(userId);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password does not match");

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await saveUser(user);

  return true;
};
