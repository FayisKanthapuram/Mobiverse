import {
  registerAdminService,
  loginAdminService,
  logoutAdminService,
} from "./admin.auth.service.js";
import {
  adminRegisterSchema,
  adminLoginSchema,
} from "./admin.auth.validator.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import { AdminAuthMessages } from "../../shared/constants/messages/adminAuthMessages.js";
// Admin auth controller - handle admin auth HTTP requests

// Register a new admin
export const registerAdmin = async (req, res) => {
  const { error } = adminRegisterSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const admin = await registerAdminService(req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    admin,
  });
};

// Render admin login page
export const loadLogin = (req, res) => {
  res.status(HttpStatus.OK).render("admin/login", { layout: false });
};

// Authenticate admin and start session
export const loginAdmin = async (req, res) => {
  const { error } = adminLoginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  const { email, password } = req.body;
  const admin = await loginAdminService(email, password);

  req.session.admin = { id: admin._id };

  res.status(HttpStatus.OK).json({
    success: true,
    message: AdminAuthMessages.ADMIN_LOGGED_IN,
    redirect: "/admin/dashboard",
  });
};
// Logout admin and clear session
export const logoutAdmin = async (req, res) => {
  delete req.session.admin; // ✅ remove admin only
  res.clearCookie("admin.sid"); // ✅ clear admin cookie

  const result = logoutAdminService();

  res.status(HttpStatus.OK).json({
    success: result.success,
    message: result.message,
    redirect: "/admin/login",
  });
};

