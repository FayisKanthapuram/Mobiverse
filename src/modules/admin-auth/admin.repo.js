// Admin repository - DB operations for admin users
import Admin from "./admin.model.js";

// Create a new admin
export const createAdmin = (adminData) => {
  return Admin.create(adminData);
};

// Find admin by email
export const findAdminByEmail = (email) => {
  return Admin.findOne({ email });
};

