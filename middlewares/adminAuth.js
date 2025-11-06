export const isLogin = (req, res, next) => {
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    next();
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.session.admin) {
    res.redirect("/admin/login");
  } else {
    next();
  }
};
