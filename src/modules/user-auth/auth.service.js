import bcrypt from "bcrypt";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

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
import {
  createWallet,
  findWalletByUserId,
  updateWalletBalanceAndCredit,
} from "../wallet/repo/wallet.repo.js";
import { NEW_USER_REWARD } from "../../shared/constants/defaults.js";
import { createLedgerEntry } from "../wallet/repo/wallet.ledger.repo.js";
import {
  findUserByReferralId,
  updateUserWalletBalance,
} from "../user/user.repo.js";
import { createRefferalLog } from "../referral/referral.repo.js";
import { rewardNewUserReferral } from "../referral/referral.service.js";

/* ----------------------------------------------------
   SIGNUP – STEP 1
---------------------------------------------------- */
const cooldownSeconds = 30;
export const registerUserService = async (body, session) => {
  const { username, email, password, referralCode } = body;

  const exists = await findUserByEmail(email);
  if (exists) {
    throw new AppError(
      "User already exists with this email",
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
    throw new AppError("Failed to send OTP", HttpStatus.INTERNAL_SERVER_ERROR);
  }
  console.log(otp);

  session.otp = otp;
  session.otpExpiry = expiry;
  session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;
};

/* ----------------------------------------------------
   SIGNUP – STEP 2 (VERIFY OTP)
---------------------------------------------------- */
export const verifySignUpOtpService = async (otp, session) => {
  if (!session.otp || !session.tempUser) {
    throw new AppError(
      "OTP not found. Please signup again.",
      HttpStatus.BAD_REQUEST
    );
  }

  if (Date.now() > session.otpExpiry) {
    throw new AppError(
      "OTP expired. Please resend OTP.",
      HttpStatus.BAD_REQUEST
    );
  }

  if (otp !== session.otp) {
    throw new AppError("Incorrect OTP", HttpStatus.BAD_REQUEST);
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

/* ----------------------------------------------------
   RESEND OTP
---------------------------------------------------- */
export const resendOtpService = async (session) => {
  // ============================
  // SERVER-SIDE COOLDOWN CHECK
  // ============================
  if (session.otpCooldownEnd && Date.now() < session.otpCooldownEnd) {
    const remaining = Math.ceil((session.otpCooldownEnd - Date.now()) / 1000);

    throw new AppError(
      `Please wait ${remaining}s before resending OTP`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  // ============================
  // SIGNUP OTP FLOW
  // ============================
  if (session.tempUser) {
    const { otp, expiry } = createOtp();

    session.otp = otp;
    session.otpExpiry = expiry;
    session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;

    const sent = await sendOtpEmail(session.tempUser.email, otp, "resend");

    if (!sent) {
      throw new AppError(
        "Failed to resend OTP",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    console.log("Signup OTP:", otp);
    return;
  }

  // ============================
  // RECOVERY OTP FLOW
  // ============================
  if (session.recoverEmail) {
    const { otp, expiry } = createOtp();

    session.recoveryOtp = otp;
    session.recoveryOtpExpiry = expiry;
    session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;

    const sent = await sendOtpEmail(session.recoverEmail, otp, "forgot");

    if (!sent) {
      throw new AppError(
        "Failed to resend OTP",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    console.log("Recovery OTP:", otp);
    return;
  }

  // ============================
  // NO VALID OTP CONTEXT
  // ============================
  throw new AppError(
    "No OTP session found. Please start again.",
    HttpStatus.BAD_REQUEST
  );
};


/* ----------------------------------------------------
   LOGIN
---------------------------------------------------- */
export const loginUserService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("User not found", HttpStatus.UNAUTHORIZED);
  }

  if (user.isBlocked) {
    throw new AppError(
      "Your account is blocked. Contact admin.",
      HttpStatus.FORBIDDEN
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid password", HttpStatus.UNAUTHORIZED);
  }

  return user;
};

/* ----------------------------------------------------
   FORGOT PASSWORD – SEND OTP
---------------------------------------------------- */
export const sendRecoverOtpService = async (email, session) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(
      "No account found with this email",
      HttpStatus.NOT_FOUND
    );
  }

  if (!user.password) {
    throw new AppError(
      "Password reset not available for Google users",
      HttpStatus.BAD_REQUEST
    );
  }

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(email, otp, "forgot");
  if (!sent) {
    throw new AppError("Failed to send OTP", HttpStatus.INTERNAL_SERVER_ERROR);
  }
  console.log(otp)

  session.recoveryOtp = otp;
  session.recoveryOtpExpiry = expiry;
  session.recoverEmail = email;
  session.otpCooldownEnd = Date.now() + cooldownSeconds * 1000;
};

/* ----------------------------------------------------
   VERIFY RECOVERY OTP
---------------------------------------------------- */
export const verifyRecoveryOtpService = async (otp, session) => {
  if (!session.recoveryOtp) {
    throw new AppError("OTP not found", HttpStatus.BAD_REQUEST);
  }

  if (Date.now() > session.recoveryOtpExpiry) {
    throw new AppError("OTP expired", HttpStatus.BAD_REQUEST);
  }

  if (otp !== session.recoveryOtp) {
    throw new AppError("Incorrect OTP", HttpStatus.BAD_REQUEST);
  }

  session.recoveryOtp = null;
  session.recoveryOtpExpiry = null;
  session.resetPass = true;
};

/* ----------------------------------------------------
   RESET PASSWORD
---------------------------------------------------- */
export const resetPasswordService = async (password, session) => {
  if (!session.recoverEmail || !session.resetPass) {
    throw new AppError("Unauthorized password reset", HttpStatus.UNAUTHORIZED);
  }

  const hashed = await bcrypt.hash(password, 10);
  await updateUserPassword(session.recoverEmail, hashed);

  session.resetPass = false;
  session.recoverEmail = null;
};
