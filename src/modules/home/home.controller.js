import { loadHomeService } from "./home.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

/* ----------------------------------------------------
   HOME PAGE
---------------------------------------------------- */
export const loadHome = async (req, res) => {
  const data = await loadHomeService(req?.user?._id);

  res.status(HttpStatus.OK).render("user/home", {
    ...data,
    pageTitle: "Home",
    pageJs: "home",
  });
};

/* ----------------------------------------------------
   ABOUT PAGE
---------------------------------------------------- */
export const loadAbout = async (req, res) => {
  res.status(HttpStatus.OK).render("user/aboutUs", {
    pageTitle: "About Us",
  });
};

/* ----------------------------------------------------
   CONTACT PAGE
---------------------------------------------------- */
export const loadContact = async (req, res) => {
  res.status(HttpStatus.OK).render("user/contact", {
    pageTitle: "Contact Us",
  });
};
