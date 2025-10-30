function setLayout(type) {
  return function (req, res, next) {
    if (type === "admin") {
        res.locals.layout = "./layouts/adminLayout";
    } else if (type === "user") {
      res.locals.layout = "./layouts/userLayout";
    }
    next();
  };
}

export default setLayout;

