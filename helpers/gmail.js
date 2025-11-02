import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendVerificationEmail = async (email, otp, context = "signup") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    let subject, text, html;
    if (context === "forgot") {
      subject = "Reset Your Password";
      text = `Your OTP for password reset is ${otp}`;
      html = `<b>Your OTP for password reset: ${otp}</b>`;
    } else {
      subject = "Verify your account";
      text = `Your OTP is ${otp}`;
      html = `<b> Your OTP: ${otp}</b>`;
    }
    const emailInfo = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject,
      text,
      html,
    });
    console.log(emailInfo);
    return emailInfo.accepted.length > 0;
  } catch (error) {
    console.error("Email sending failed", error);
    return false;
  }
};
