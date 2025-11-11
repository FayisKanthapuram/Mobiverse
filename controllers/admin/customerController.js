import userModel from "../../models/userModel.js";

export const loadCustomers=async(req,res)=>{
    const customers= await userModel.find();
    res.render("admin/customers",{pageTitle:"Customers",pageCss:'customers',pageJs:'customers',customers});
}