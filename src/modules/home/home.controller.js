import { loadHomeService } from "./home.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const loadHome = async (req, res, next) => {
  try {
    const data = await loadHomeService(req.session.user);

    return res.status(HttpStatus.OK).render("user/home", {
      ...data,
      pageTitle: "Home",
      pageJs: "home",
    });
  } catch (error) {
    next(error);
  }
};