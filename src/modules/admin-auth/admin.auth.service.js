import bcrypt from "bcrypt";
import { createAdmin, findAdminByEmail } from "./admin.repo.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AdminAuthMessages } from "../../shared/constants/messages/adminAuthMessages.js";
// Admin auth service - business logic for admin authentication

// Register admin service
export const registerAdminService = async (adminData) => {
  const { username, email, password } = adminData;

  const existingAdmin = await findAdminByEmail(email);
  if (existingAdmin) {
    throw new AppError(AdminAuthMessages.ADMIN_EXISTS, HttpStatus.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await createAdmin({
    username,
    email,
    password: hashedPassword,
  });

  return admin;
};

// Login admin service
export const loginAdminService = async (email, password) => {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    throw new AppError(AdminAuthMessages.ADMIN_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new AppError(AdminAuthMessages.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
  }

  return admin;
};

// Logout admin service
export const logoutAdminService = () => {
  return {
    success: true,
    message: AdminAuthMessages.ADMIN_LOGGED_OUT,
  };
};
