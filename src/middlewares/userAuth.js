import userModel from "../modules/user/user.model.js";

export const isLogin = (req, res, next) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    next();
  }
};


export const requireLogin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user);

    if (user && user.isBlocked) {
      return req.session.destroy((err) => {
        if (err) {
          console.log(err);
          return res.redirect("/home");
        }
        res.clearCookie("user.sid");
        return res.redirect("/login?error=blocked");
      });
    }
    if (!user) {
      return res.redirect("/login?error=login");
    }
    next();
  } catch (err) {
    console.log(err);
    return res.redirect("/login");
  }
};

export const isVerifyOtp = (req, res, next) => {
  if (!req.session.otp) {
    res.redirect("/signUp");
  } else {
    next();
  }
};

export const isVerifyRecoveryOtp = (req, res, next) => {
  if (!req.session.recoveryOtp) {
    res.redirect("/forgotPassword");
  } else {
    next();
  }
};

export const isResetPass = (req, res, next) => {
  if (!req.session.resetPass) {
    res.redirect("/forgotPassword");
  } else {
    next();
  }
};
