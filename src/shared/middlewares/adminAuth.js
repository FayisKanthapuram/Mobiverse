export const isLogin = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  next();
};

export const verifyAdmin = (req, res, next) => {
  if (!req.session.admin) {
    res.redirect("/admin/login");
  } else {
    next();
  }
};
