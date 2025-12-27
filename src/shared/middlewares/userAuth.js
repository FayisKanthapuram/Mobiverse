export const isLogin = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  }
  next();
};

export const requireLogin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect("/login?error=login");
  }

  if (req.user.isBlocked) {
    req.logout(() => {
      req.session.toast = {
        type: "error",
        message: "Your account has been blocked. Please contact support.",
      };

      res.clearCookie("user.sid");
      return res.redirect("/login");
    });
    return;
  }

  next();
};

export const isVerifyOtp = (req, res, next) => {
  if (!req.session.otp) {
    return res.redirect("/signup");
  }
  next();
};

export const isVerifyRecoveryOtp = (req, res, next) => {
  if (!req.session.recoveryOtp) {
    return res.redirect("/forgotPassword");
  }
  next();
};

export const isResetPass = (req, res, next) => {
  if (!req.session.resetPass) {
    return res.redirect("/forgotPassword");
  }
  next();
};
