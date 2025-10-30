import bcrypt from "bcrypt";
import Admin from "../../models/adminModel.js";

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
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
        console.log("hello")
        res.redirect("/admin/login");//TODO:tosify message not given
    }
    const isMatch=await bcrypt.compare(password,admin.password);
    if(!isMatch){
        console.log("dfs")
        res.redirect("/admin/login");//TODO:tosify message not given
    }
    res.redirect("/admin/dashboard")
  } catch (error) {}
};

export const loadDashboard = (req, res) => {
  res.render("admin/dashboard", { pageTitle: "Dashboard" });
};
