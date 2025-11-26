import {
  registerAdminService,
  loginAdminService,
  logoutAdminService,
} from "../../services/adminAuthService.js";
import {
  adminRegisterSchema,
  adminLoginSchema,
} from "../../validators/adminAuthValidator.js";

export const registerAdmin = async (req, res) => {
  try {
    const { error } = adminRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const admin = await registerAdminService(req.body);
    res.status(201).json({ success: true, admin: admin });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Registration failed",
      });
  }
};

export const loadLogin = (req, res) => {
  res.render("admin/login", { layout: false });
};

export const loginAdmin = async (req, res) => {
  try {
    const { error } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const admin = await loginAdminService(email, password);

    req.session.admin = {
      id: admin._id,
    };

    res.json({
      success: true,
      message: "Admin logged in successfully",
      redirect: "/admin/dashboard",
    });
  } catch (error) {
    console.log(error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const loadDashboard = (req, res) => {
  res.render("admin/dashboard", { pageTitle: "Dashboard" });
};

export const logoutAdmin = (req, res) => {
  try {
    req.session.destroy();
    const result = logoutAdminService();
    res.json({
      success: result.success,
      message: result.message,
      redirect: "/admin/login",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
