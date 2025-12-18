import * as dashboardService from "./dashboard.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const getStats = async (req, res) => {
  const data = await dashboardService.getDashboardStatsService();
  res.json({ success: true, data });
};

export const getSalesChart = async (req, res) => {
  const data = await dashboardService.getSalesChartService(req.query.filter);
  console.log(data)
  res.json({ success: true, data });
};

export const getOrderStatus = async (req, res) => {
  const data = await dashboardService.getOrderStatusService();
  res.json({ success: true, data });
};

export const getTopProducts = async (req, res) => {
  const data = await dashboardService.getTopProductsService();
  res.json({ success: true, data });
};

export const getTopBrands = async (req, res) => {
  const data = await dashboardService.getTopBrandsService();
  res.json({ success: true, data });
};

export const getRecentOrders = async (req, res) => {
  const data = await dashboardService.getRecentOrdersService();
  res.json({ success: true, data });
};

export const loadDashboard = (req, res) => {
  res.status(HttpStatus.OK).render("admin/dashboard", {
    pageTitle: "Dashboard",
  });
};
