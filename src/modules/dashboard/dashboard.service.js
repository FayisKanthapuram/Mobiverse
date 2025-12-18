import {
  getDashboardStatsRepo,
  getSalesChartRepo,
  getOrderStatusRepo,
  getTopProductsRepo,
  getTopBrandsRepo,
  getRecentOrdersRepo,
} from "./dashboard.repo.js";

export const getDashboardStatsService = () => getDashboardStatsRepo();

export const getSalesChartService = async (filter) => {
  const now = new Date();
  let startDate, groupBy;

  if (filter === "weekly") {
    startDate = new Date(now.setDate(now.getDate() - 6));
    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  } else if (filter === "monthly") {
    startDate = new Date(now.setDate(now.getDate() - 27));
    groupBy = { week: { $week: "$createdAt" } };
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    groupBy = { month: { $month: "$createdAt" } };
  }

  const raw = await getSalesChartRepo(startDate, groupBy);
  return {
    labels: raw.map((item) => item._id),
    data: raw.map((item) => item.revenue),
  }; 
};

export const getOrderStatusService = async () => {
  const raw = await getOrderStatusRepo();

  return {
    labels: raw.map((item) => item._id),
    data: raw.map((item) => item.count),
  };
};

export const getTopProductsService = async () => {
  const data = await getTopProductsRepo();
  return data.map((p, i) => ({
    rank: i + 1,
    name: p.product.name,
    sales: p.sales,
    revenue: p.revenue,
  }));
};

export const getTopBrandsService = async () => {
  const data = await getTopBrandsRepo();
  return data.map((b, i) => ({
    rank: i + 1,
    name: b.brand.brandName,
    sales: b.sales,
    revenue: b.revenue,
  }));
};

export const getRecentOrdersService = async () => {
  const orders = await getRecentOrdersRepo();
  return orders.map((o) => ({
    id: o.orderId,
    customer: o.userId?.username || "Guest",
    amount: o.finalAmount,
    status: o.orderStatus,
  }));
};