export const setUser = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};