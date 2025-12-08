import { generateOtp } from "../../helpers/otp.js";
import { sendVerificationEmail } from "../../helpers/gmail.js";

export const createOtp = () => ({
  otp: generateOtp(),
  expiry: Date.now() + 1 * 60 * 1000
});

export const sendOtpEmail = async (email, otp) => {
  return await sendVerificationEmail(email, otp);
};
