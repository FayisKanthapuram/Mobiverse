import bcrypt from "bcrypt";
import Admin from "../../models/adminModel.js";
import Joi from "joi";

export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ success: true, admin: admin });
  } catch (error) {
    console.log(error);
    res.status(404).json({ success: false, error: error.error });
  }
};

export const loadLogin = (req, res) => {
  res.render("admin/login", { layout: false });
};

export const loginAdmin = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email",
        "string.empty": "Email is required",
      }),
      password: Joi.string().min(4).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 4 characters",
      }),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin is not found" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }
    req.session.admin = {
      id: admin._id
    };
    res.json({ success: true , message:"Admin log in successfully", redirect: "/admin/dashboard" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loadDashboard = (req, res) => {
  res.render("admin/dashboard", { pageTitle: "Dashboard" });
};

export const logoutAdmin = (req, res) => {
  try {
    req.session.destroy();
    res.json({
      success: true,
      message: "Admin logged out successfully",
      redirect: "/admin/login",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Logout failed",
    });
  }
};
