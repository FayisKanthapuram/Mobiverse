export const isLogin = (req, res, next) => {
  if (req.session.user) {
    res.redirect("/user/home");
  } else {
    next();
  }
};

export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/user/signup");
  } else {
    next();
  }
};