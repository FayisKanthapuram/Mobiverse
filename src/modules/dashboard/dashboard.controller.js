import { getDashboardPageService } from "./dashboard.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

// Dashboard controller - render admin dashboard
export const loadDashboard = async (req, res) => {
  const filter = req.query.filter || "weekly";

  const data = await getDashboardPageService(filter);

  res.status(HttpStatus.OK).render("admin/dashboard", {
    pageTitle: "Dashboard",
    ...data,
    filter,
  });
};
