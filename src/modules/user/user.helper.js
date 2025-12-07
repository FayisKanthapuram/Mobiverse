import { sendVerificationEmail } from "../../helpers/gmail.js";
import { generateOtp } from "../../helpers/otp.js";

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
