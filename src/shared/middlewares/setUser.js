import { DEFAULT_USER_AVATAR, LOGO, LOGONAME } from "../constants/assets.js";

export const setUser = (req, res, next) => {
  res.locals.defaultAvatar = DEFAULT_USER_AVATAR;
  res.locals.logoName = LOGONAME;
  res.locals.logo = LOGO;
  res.locals.user = req.isAuthenticated() ? req.user : null;

  res.locals.toast = req.session.toast || null;
  delete req.session.toast;

  res.set("Cache-Control", "no-store");
  next();
};
