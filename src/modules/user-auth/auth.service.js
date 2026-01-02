import bcrypt from "bcrypt";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";
import { UserAuthMessages } from "../../shared/constants/messages/userAuthMessages.js";

import {
  findUserByEmail,
  createUser,
  updateUserPassword,
} from "./auth.repo.js";

import {
  createOtp,
  generateReferralCode,
  sendOtpEmail,
} from "./auth.helper.js";
import { createWallet } from "../wallet/repo/wallet.repo.js";
import { findUserByReferralId } from "../user/user.repo.js";
import { rewardNewUserReferral } from "../referral/referral.service.js";
import { createWishlist } from "../wishlist/wishlist.repo.js";

// Auth service - signup, login, recovery flows
const cooldownSeconds = 30;
// Register user (step 1) - create temp session and send OTP
export const registerUserService = async (body, session) => {
  const { username, email, password, referralCode } = body;

  const exists = await findUserByEmail(email);
  if (exists) {
    throw new AppError(
      UserAuthMessages.USER_ALREADY_EXISTS,
      HttpStatus.BAD_REQUEST
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  session.tempUser = {
    username,
    email,
    password: hashedPassword,
    referralCode,
  };

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(email, otp, "signup");
  if (!sent) {
    throw new AppError(
      UserAuthMessages.FAILED_SEND_OTP,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  console.log("Signup OTP:", otp);

  session.otp = otp;
  session.otpExpiry = expiry;
  session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;
};

// Verify signup OTP (step 2)
export const verifySignUpOtpService = async (otp, session) => {
  if (!session.otp || !session.tempUser) {
    throw new AppError(
      UserAuthMessages.OTP_NOT_FOUND_SIGNUP,
      HttpStatus.BAD_REQUEST
    );
  }

  if (Date.now() > session.otpExpiry) {
    throw new AppError(
      UserAuthMessages.OTP_EXPIRED_RESEND,
      HttpStatus.BAD_REQUEST
    );
  }

  if (otp !== session.otp) {
    throw new AppError(UserAuthMessages.INCORRECT_OTP, HttpStatus.BAD_REQUEST);
  }

  const referralCode = generateReferralCode(session.tempUser.username);

  let referrer = null;
  if (session.tempUser.referralCode) {
    referrer = await findUserByReferralId(
      session.tempUser.referralCode.toUpperCase()
    );
  }

  const user = await createUser({
    ...session.tempUser,
    referralCode,
    referredBy: referrer?._id,
  });

  await createWallet(user._id);
  await createWishlist(user._id);

  if (referrer && referrer._id.toString() !== user._id.toString()) {
    await rewardNewUserReferral({
      userId: user._id,
      referrer,
      referralCode: session.tempUser.referralCode,
    });
  }

  session.tempUser = null;
  session.otp = null;
  session.otpExpiry = null;
};

// Resend OTP - handles signup and recovery flows with cooldown
export const resendOtpService = async (session) => {
  // Server-side cooldown check
  if (session.otpCooldownEnd && Date.now() < session.otpCooldownEnd) {
    const remaining = Math.ceil((session.otpCooldownEnd - Date.now()) / 1000);

    throw new AppError(
      UserAuthMessages.PLEASE_WAIT_RESEND.replace("{remaining}", remaining),
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  // Signup OTP flow
  if (session.tempUser) {
    const { otp, expiry } = createOtp();

    session.otp = otp;
    session.otpExpiry = expiry;
    session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;

    const sent = await sendOtpEmail(session.tempUser.email, otp, "resend");

    if (!sent) {
      throw new AppError(
        UserAuthMessages.FAILED_RESEND_OTP,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    console.log("Resend OTP For Signup OTP:", otp);
    return;
  }

  // Recovery OTP flow
  if (session.recoverEmail) {
    const { otp, expiry } = createOtp();

    session.recoveryOtp = otp;
    session.recoveryOtpExpiry = expiry;
    session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;

    const sent = await sendOtpEmail(session.recoverEmail, otp, "forgot");

    if (!sent) {
      throw new AppError(
        UserAuthMessages.FAILED_RESEND_OTP,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    console.log("Resend OTP For Recovery OTP:", otp);
    return;
  }

  // No valid OTP context
  throw new AppError(UserAuthMessages.NO_OTP_SESSION, HttpStatus.BAD_REQUEST);
};

// Login user service - validate credentials
export const loginUserService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(UserMessages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
  }

  if (user.isBlocked) {
    throw new AppError(
      UserAuthMessages.ACCOUNT_BLOCKED,
      HttpStatus.FORBIDDEN
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError(UserAuthMessages.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
  }

  return user;
};

// Send recovery OTP for password reset
export const sendRecoverOtpService = async (email, session) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(UserAuthMessages.NO_ACCOUNT_FOUND_EMAIL, HttpStatus.NOT_FOUND);
  }

  if (!user.password) {
    throw new AppError(
      UserAuthMessages.PASSWORD_RESET_NOT_AVAILABLE,
      HttpStatus.BAD_REQUEST
    );
  }

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(email, otp, "forgot");
  if (!sent) {
    throw new AppError(
      UserAuthMessages.FAILED_SEND_OTP,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  console.log("Recovery OTP:", otp);

  session.recoveryOtp = otp;
  session.recoveryOtpExpiry = expiry;
  session.recoverEmail = email;
  session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;
};

// Verify recovery OTP
export const verifyRecoveryOtpService = async (otp, session) => {
  if (!session.recoveryOtp) {
    throw new AppError(UserMessages.OTP_NOT_FOUND, HttpStatus.BAD_REQUEST);
  }

  if (Date.now() > session.recoveryOtpExpiry) {
    throw new AppError(UserMessages.OTP_EXPIRED, HttpStatus.BAD_REQUEST);
  }

  if (otp !== session.recoveryOtp) {
    throw new AppError(UserAuthMessages.INCORRECT_OTP, HttpStatus.BAD_REQUEST);
  }

  session.recoveryOtp = null;
  session.recoveryOtpExpiry = null;
  session.resetPass = true;
};

// Reset password service - update stored password
export const resetPasswordService = async (password, session) => {
  if (!session.recoverEmail || !session.resetPass) {
    throw new AppError(UserAuthMessages.UNAUTHORIZED_PASSWORD_RESET, HttpStatus.UNAUTHORIZED);
  }

  const hashed = await bcrypt.hash(password, 10);
  await updateUserPassword(session.recoverEmail, hashed);

  session.resetPass = false;
  session.recoverEmail = null;
};
