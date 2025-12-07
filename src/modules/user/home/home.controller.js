import { loadHomeService } from "./home.service.js";

export const loadHome = async (req, res, next) => {
  try {
    const data = await loadHomeService(req.session.user);

    return res.render("user/home", {
      ...data,
      pageTitle: "Home",
      pageJs: "home",
    });
  } catch (error) {
    next(error);
  }
};