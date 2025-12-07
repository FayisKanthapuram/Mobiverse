// src/modules/admin/admin.repo.js
import Admin from "./admin.model.js";

export const createAdmin = (adminData) => {
  return Admin.create(adminData);
};

export const findAdminByEmail = (email) => {
  return Admin.findOne({ email });
};

