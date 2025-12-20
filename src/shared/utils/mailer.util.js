import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

/**
 * Generic email sender for Mobiverse
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Mobiverse" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return info.accepted && info.accepted.length > 0;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
