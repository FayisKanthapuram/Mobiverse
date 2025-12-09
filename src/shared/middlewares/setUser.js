import { DEFAULT_USER_AVATAR, LOGO, LOGONAME } from "../../config/cloudinaryDefaults.js";

export const setUser = (req, res, next) => {
  res.locals.defaultAvatar=DEFAULT_USER_AVATAR;
  res.locals.logoName=LOGONAME;
  res.locals.logo=LOGO;
  res.locals.user = req.session.user || null;
  res.set("Cache-Control", "no-store");
  next();
};