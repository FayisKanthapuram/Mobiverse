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

export const registerAdmin = async (req, res) => {
  try {
    const { error } = adminRegisterSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const admin = await registerAdminService(req.body);
    res.status(HttpStatus.CREATED).json({ success: true, admin: admin });
  } catch (error) {
    console.log(error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const loadLogin = (req, res) => {
  res.status(HttpStatus.OK).render("admin/login", { layout: false });
};

export const loginAdmin = async (req, res) => {
  try {
    const { error } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const admin = await loginAdminService(email, password);

    req.session.admin = {
      id: admin._id,
    };

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Admin logged in successfully",
      redirect: "/admin/dashboard",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const loadDashboard = (req, res) => {
  res.status(HttpStatus.OK).render("admin/dashboard", { pageTitle: "Dashboard" });
};

export const logoutAdmin = (req, res) => {
  try {
    req.session.destroy();
    const result = logoutAdminService();
    res.status(HttpStatus.OK).json({
      success: result.success,
      message: result.message,
      redirect: "/admin/login",
    });
  } catch (error) {
    console.log(error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed",
    });
  }
};
