import bcrypt from "bcrypt";
import { createAdmin, findAdminByEmail } from "./admin.repo.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";


/* ----------------------------------------------------
   REGISTER ADMIN
---------------------------------------------------- */
export const registerAdminService = async (adminData) => {
  const { username, email, password } = adminData;

  const existingAdmin = await findAdminByEmail(email);
  if (existingAdmin) {
    throw new AppError("Admin already exists with this email", HttpStatus.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await createAdmin({
    username,
    email,
    password: hashedPassword,
  });

  return admin;
};

/* ----------------------------------------------------
   LOGIN ADMIN
---------------------------------------------------- */
export const loginAdminService = async (email, password) => {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    throw new AppError("Admin not found", HttpStatus.NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new AppError("Invalid password", HttpStatus.UNAUTHORIZED);
  }

  return admin;
};

/* ----------------------------------------------------
   LOGOUT ADMIN
---------------------------------------------------- */
export const logoutAdminService = () => {
  return {
    success: true,
    message: "Admin logged out successfully",
  };
};
