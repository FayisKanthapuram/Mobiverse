import { sendVerificationEmail } from "../../shared/utils/gmail.js";
import { generateOtp } from "../../shared/utils/otp.js";

export const createOtpPayload = () => {
  const otp = generateOtp();
  return {
    otp,
    expiry: Date.now() + 1 * 60 * 1000,
  };
};

export const sendOtpEmail = async (email, otp) => {
  return await sendVerificationEmail(email, otp);
};
