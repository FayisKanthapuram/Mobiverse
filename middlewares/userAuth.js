export const isLogin = (req, res, next) => {
  if (req.session.user) {
    res.redirect("/user/home");
  } else {
    next();
  }
};

export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/user/login");
  } else {
    next();
  }
};

export const isVerifyOtp=(req,res,next)=>{
  if(!req.session.otp){
    res.redirect('/user/signUp');
  }else{
    next();
  }
}

export const isVerifyRecoveryOtp=(req,res,next)=>{
  if(!req.session.recoveryOtp){
    res.redirect('/user/forgotPassword')
  }else{
    next();
  }
}

export const isResetPass=(req,res,next)=>{
  if(!req.session.resetPass){
    res.redirect('/user/forgotPassword')
  }else{
    next();
  }
}