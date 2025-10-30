import bcrypt from "bcrypt";
import User from "../../models/userModel.js";


export const loadSignUp=(req,res)=>{
    res.render('user/signUp',{pageTitle:"Sign Up",pageCss:"auth"});
}

export const registerUser=(req,res)=>{
    try {
         
    } catch (error) {
        console.log(error);
        res.status(404).json({ success: false, error: error.error });
    }
}