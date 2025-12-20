import { findVariantsByProduct } from "../product/repo/variant.repo.js";
import {
  getDashboardStatsRepo,
  getSalesChartRepo,
  getOrderStatusRepo,
  getTopProductsRepo,
  getTopBrandsRepo,
  getRecentOrdersRepo,
} from "./dashboard.repo.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const getDashboardStatsService = async () => {
  return getDashboardStatsRepo();
};

export const getSalesChartService = async (filter) => {
  const now = new Date();
  let startDate;
  let groupBy;
  let labelFormatter;

  if (filter === "hourly") {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    groupBy = {
      $hour: { date: "$createdAt", timezone: "Asia/Kolkata" },
    };

    labelFormatter = (hour) => {
      const h = hour % 12 || 12;
      const suffix = hour >= 12 ? "PM" : "AM";
      return `${h} ${suffix}`;
    };
  } else if (filter === "weekly") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    groupBy = {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$createdAt",
        timezone: "Asia/Kolkata",
      },
    };

    labelFormatter = (id) => id;
  } else if (filter === "monthly") {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);

    groupBy = {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$createdAt",
        timezone: "Asia/Kolkata",
      },
    };

    labelFormatter = (id) => id;
  } else if (filter === "yearly") {
    startDate = new Date(now.getFullYear(), 0, 1);

    groupBy = {
      $month: { date: "$createdAt", timezone: "Asia/Kolkata" },
    };

    labelFormatter = (month) =>
      new Date(2024, month - 1).toLocaleString("en-IN", {
        month: "short",
      });
  } else {
    throw new AppError("Invalid dashboard filter", HttpStatus.BAD_REQUEST);
  }

  const raw = await getSalesChartRepo(startDate, groupBy);

  if (filter === "hourly") {
    const fullHours = Array.from({ length: 24 }, (_, i) => i);
    const map = new Map(raw.map((r) => [r._id, r.revenue]));

    return {
      labels: fullHours.map(labelFormatter),
      data: fullHours.map((h) => map.get(h) || 0),
    };
  }

  return {
    labels: raw.map((r) => labelFormatter(r._id)),
    data: raw.map((r) => r.revenue),
  };
};

export const getOrderStatusService = async () => {
  const raw = await getOrderStatusRepo();
  return {
    labels: raw.map((r) => r._id),
    data: raw.map((r) => r.count),
  };
};

export const getTopProductsService = async () => {
  const data = await getTopProductsRepo();

  for (const item of data) {
    const variants = await findVariantsByProduct(item.product._id);
    item.product.image = variants?.[0]?.images?.[0];
  }

  return data.map((p, i) => ({
    rank: i + 1,
    name: p.product.name,
    logo: p.product.image,
    sales: p.sales,
    revenue: p.revenue,
  }));
};

export const getTopBrandsService = async () => {
  const data = await getTopBrandsRepo();

  return data.map((b, i) => ({
    rank: i + 1,
    name: b.brand.brandName,
    logo: b.brand.logo,
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

export const getDashboardPageService = async (filter) => {
  const [stats, salesChart, orderStatus, topProducts, topBrands, recentOrders] =
    await Promise.all([
      getDashboardStatsRepo(),
      getSalesChartService(filter),
      getOrderStatusService(),
      getTopProductsService(),
      getTopBrandsService(),
      getRecentOrdersService(),
    ]);

  return {
    stats,
    salesChart,
    orderStatus,
    topProducts,
    topBrands,
    recentOrders,
  };
};
