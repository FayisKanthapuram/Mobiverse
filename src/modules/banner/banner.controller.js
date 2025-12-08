import { HttpStatus } from "../../shared/constants/statusCode.js";

export const loadBanners = (req, res) => {
  res.status(HttpStatus.OK).render("admin/banners", { pageTitle: "Banners" });
};
