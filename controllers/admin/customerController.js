import userModel from "../../models/userModel.js";

export const loadCustomers=async(req,res)=>{
    const customers= await userModel.find().lean();
    const totalCustomersCound=await userModel.countDocuments().lean();
    const blockedCustomerCount=await userModel.countDocuments().lean();
    res.render("admin/customers",{pageTitle:"Customers",pageCss:'customers',pageJs:'customers',customers,totalCustomersCound,blockedCustomerCount});
}