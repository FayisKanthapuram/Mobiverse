// import bcrypt from "bcrypt";
// import User from "../../models/userModel.js";


export const loadSignUp=(req,res)=>{
    res.render('user/signUp',{pageTitle:"Sign Up",pageCss:"auth"});
}

