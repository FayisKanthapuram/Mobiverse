import bcrypt from "bcrypt";
import Admin from "../models/adminModel.js";

// Register a new admin
export const registerAdminService = async (adminData) => {
  const { username, email, password } = adminData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    username,
    email,
    password: hashedPassword,
  });

  return admin;
};

// Login admin
export const loginAdminService = async (email, password) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    const err = new Error("Invalid password");
    err.status = 401;
    throw err;
  }

  return admin;
};


// Logout admin (session handling)
export const logoutAdminService = () => {
  return { success: true, message: "Admin logged out successfully" };
};
