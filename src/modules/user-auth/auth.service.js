import bcrypt from "bcrypt";
import {
  findUserByEmail,
  createUser,
  updateUserPassword
} from "./auth.repo.js";

import { createOtp, generateReferralCode, sendOtpEmail } from "./auth.helper.js";
import {
  createWallet,
  findWalletByUserId,
  updateWalletBalanceAndCredit,
} from "../wallet/repo/wallet.repo.js";
import { NEW_USER_REWARD } from "../../shared/constants/defaults.js";
import { createLedgerEntry } from "../wallet/repo/wallet.ledger.repo.js";
import { findUserByReferralId, updateUserWalletBalance } from "../user/user.repo.js";
import { createRefferalLog } from "../referral/referral.repo.js";

// SIGNUP - STEP 1
export const registerUserService = async (body, session) => {
  const { username, email, password, referralCode } = body;

  const exists = await findUserByEmail(email);
  if (exists) throw new Error("User already exist with this email");

  const hashedPassword = await bcrypt.hash(password, 10);

  // Store temporary user
  session.tempUser = { username, email, password: hashedPassword ,referralCode};

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(email, otp, "signup");
  console.log(otp)
  if (!sent) throw new Error("Failed to send OTP");

  session.otp = otp;
  session.otpExpiry = expiry;

  return true;
};

// SIGNUP - STEP 2 (Verify OTP)
export const verifySignUpOtpService = async (otp, session) => {
  if (!session.otp || !session.tempUser) {
    throw new Error("OTP not found. Please signup again.");
  }

  if (Date.now() > session.otpExpiry) {
    throw new Error("OTP expired. Please resend OTP.");
  }

  if (otp !== session.otp) {
    throw new Error("Incorrect OTP. Try again.");
  }

  //generate self referal code
  const referralCode = generateReferralCode(session.tempUser.username);

  //create user
  const user = await createUser({...session.tempUser,referralCode});

  //create wallet
  await createWallet(user._id);

  if (session.tempUser.referralCode) {
    const code = session.tempUser.referralCode.toUpperCase();

    // 1) Find the referrer
    const referrer = await findUserByReferralId(code)

    if (referrer && referrer._id.toString() !== user._id.toString()) {
      // 2) Create referral entry
      const entry = {
        referrer: referrer._id,
        referredUser: user._id,
        referralCode: code,
        status: "REGISTERED",
      };
      await createRefferalLog(entry);
      // give 50 joining bonus to new user
      await creditReferralBonusToNewUser(user._id, NEW_USER_REWARD);
    }
  }

  session.tempUser = null;
  session.otp = null;
  session.otpExpiry = null;

  return true;
};

export const creditReferralBonusToNewUser = async (userId, amount) => {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) throw new Error("Wallet not found");

  const newBalance = wallet.balance + amount;

  // Update wallet values
  await updateWalletBalanceAndCredit(userId, amount);

  await updateUserWalletBalance(userId,newBalance);

  // Create ledger record
  const ledger = await createLedgerEntry({
    walletId: wallet._id,
    userId,
    amount,
    balanceAfter: newBalance,
    type: "REFERRAL",
    note: "Referral Signup Bonus",
  });

  return ledger;
};

// RESEND OTP
export const resendOtpService = async (session) => {
  if (!session.tempUser) throw new Error("No user data found");

  const email = session.tempUser.email;

  const { otp, expiry } = createOtp();
  session.otp = otp;
  session.otpExpiry = expiry;

  const sent = await sendOtpEmail(email, otp, "resend");
  console.log(otp)
  if (!sent) throw new Error("Failed to resend OTP");

  return true;
};

// LOGIN
export const loginUserService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User is not found");

  if (user.isBlocked) throw new Error("Your account is blocked. Contact admin.");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid Password");

  return user;
};

// FORGOT PASSWORD
export const sendRecoverOtpService = async (email, session) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("No account found with this email");

  if (!user.password)
    throw new Error("Password change not available for Google users");

  const { otp, expiry } = createOtp();

  const sent = await sendOtpEmail(email, otp, "forgot");
  if (!sent) throw new Error("Failed to send OTP");

  session.recoveryOtp = otp;
  session.recoveryOtpExpiry = expiry;
  session.recoverEmail = email;

  return true;
};

// VERIFY RECOVERY OTP
export const verifyRecoveryOtpService = async (otp, session) => {
  if (!session.recoveryOtp) throw new Error("OTP not found");

  if (Date.now() > session.recoveryOtpExpiry) {
    throw new Error("OTP expired");
  }

  if (otp !== session.recoveryOtp) throw new Error("Incorrect OTP");

  session.recoveryOtp = null;
  session.recoveryOtpExpiry = null;
  session.resetPass = true;

  return true;
};

// RESET PASSWORD
export const resetPasswordService = async (password, session) => {
  if (!session.recoverEmail) throw new Error("User not found");

  const hashed = await bcrypt.hash(password, 10);

  await updateUserPassword(session.recoverEmail, hashed);

  session.resetPass = false;

  return true;
};

export const googleLoginService = async (googleUser) => {
  if (!googleUser) throw new Error("Google authentication failed");

  if (googleUser.isBlocked) {
    throw new Error("Your account is blocked. Contact admin.");
  }

  return googleUser._id;
};
