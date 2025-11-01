import bcrypt from "bcrypt";
import User from "../../models/userModel.js";
import Joi from "joi";

export const loadSignUp = (req, res) => {
  res.render("user/signUp", {
    pageTitle: "Sign Up",
    pageCss: "auth",
    pageJs: "signUp",
  });
};

export const loadLogin = (req, res) => {
  res.render("user/login", { pageTitle: "login", pageCss: "auth" });
};

export const registerUser = async (req, res) => {
  try {
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(3).max(30).required().messages({
        "string.empty": "Username is required",
        "string.min": "Username must be at least 3 characters",
        "string.max": "Username cannot be more than 30 characters",
      }),

      email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email",
        "string.empty": "Email is required",
      }),

      password: Joi.string().min(6).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
      }),

      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
          "string.empty": "Confirm password is required",
        }),
    });
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.json({
      success: true,
      redirect: "/user/login",
      message: "User registered successflly",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const googleLogin = (req, res) => {
  try {
    if (req.user) {
      req.session.user = {
        id: req.user._id,
        name: req.user.name || req.user.displayName,
        email: req.user.email,
      };
      return res.redirect("/user/home");
    } else {
      return res.redirect("/user/signup");
    }
  } catch (err) {
    return res.redirect("/user/signup");
  }
};
