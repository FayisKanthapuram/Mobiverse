import { loadHomeService } from "./home.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

// Home controller - render public site pages
// Load home page
export const loadHome = async (req, res) => {
  const data = await loadHomeService(req?.user?._id);
  
  res.status(HttpStatus.OK).render("user/home", {
    ...data,
    pageTitle: "Home",
    pageJs: "home",
  });
};

// Load about page
export const loadAbout = async (req, res) => {
  res.status(HttpStatus.OK).render("user/aboutUs", {
    pageTitle: "About Us",
  });
};

// Load contact page
export const loadContact = async (req, res) => {
  res.status(HttpStatus.OK).render("user/contact", {
    pageTitle: "Contact Us",
  });
};
