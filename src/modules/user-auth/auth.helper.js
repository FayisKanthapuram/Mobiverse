import { generateOtp } from "../../shared/utils/otp.js";
import { sendEmail } from "../../shared/utils/mailer.util.js";
import { renderEmailTemplate } from "../../shared/utils/emailRenderer.util.js";
import { LOGONAME } from "../../shared/constants/assets.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const createOtp = () => ({
  otp: generateOtp(),
  expiry: Date.now() + 2 * 60 * 1000 // 2 min
});


export const sendOtpEmail = async ( email, otp, type = "signup" ) => {
  if (!email) {
    console.error("sendOtpEmail failed: email is missing");
    return false;
  }

  const configMap = {
    signup: {
      subject: "Verify your Mobiverse account",
      title: "Verify Your Mobiverse Account",
      message:
        "Welcome to Mobiverse! Use the code below to verify your account.",
    },
    resend: {
      subject: "Your Mobiverse verification code",
      title: "Verify Your Mobiverse Account",
      message: "Here is your new verification code.",
    },
    forgot: {
      subject: "Reset your Mobiverse password",
      title: "Reset Your Password",
      message: "Use the code below to reset your Mobiverse password.",
    },
    changeEmail: {
      subject: "Confirm your new email address",
      title: "Confirm Email Change",
      message: "Use the code below to confirm your new email address.",
    },
    resendChangeEmail: {
      subject: "Confirm your new email address",
      title: "Confirm Email Change",
      message: "Here is your new code to confirm your email address change.",
    },
  };

  const config = configMap[type];
  if (!config) throw new AppError("Invalid OTP email type", HttpStatus.BAD_REQUEST);

  const html = renderEmailTemplate("otp-email.html", {
    TITLE: config.title,
    MESSAGE: config.message,
    OTP: otp,
    YEAR: new Date().getFullYear(),
    LOGO_URL: LOGONAME,
  });

  if (!html) return false;

  return await sendEmail({
    to: email,
    subject: config.subject,
    text: `${config.title}: ${otp}`,
    html,
  });
};



export function generateReferralCode(name) {
  return (
    name.slice(0, 3).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}
