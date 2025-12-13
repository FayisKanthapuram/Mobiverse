import { LOGO } from "../../config/cloudinaryDefaults.js";
import { loadSalesReportService } from "./sales.report.service.js";

export const loadSalesReport = async (req, res) => {
  const {
    reportType = "daily",
    startDate,
    endDate,
    status = "",
    page = 1,
  } = req.query;

  const limit = 20;
  const currentPage = parseInt(page);

  const {
    totalPages,
    totalOrders,
    totalSales,
    totalDiscounts,
    orders,
    transactions,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    yearStart,
    yearEnd,
  } = await loadSalesReportService({
    reportType,
    startDate,
    endDate,
    status,
    limit,
    currentPage,
  });

  res.render("admin/sales-report", {
    pageTitle: "Sales Report",
    pageCss: "sales-report",
    pageJs: "sales-report",
    logo: LOGO,
    reportType,
    startDate,
    endDate,
    statusFilter: status,
    currentPage,
    limit,
    totalPages,
    totalTransactions: totalOrders,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    yearStart,
    yearEnd,
    salesData: {
      totalSales,
      salesGrowth: 15.5, // Calculate based on previous period
      totalOrders,
      averageOrderValue: totalSales / totalOrders,
      totalDiscounts,
      discountPercentage: (totalDiscounts / totalSales) * 100,
      productsSold: orders.reduce(
        (sum, o) => sum + o.orderedItems.reduce((s, i) => s + i.quantity, 0),
        0
      ),
      uniqueProducts: new Set(
        orders.flatMap((o) =>
          o.orderedItems.map((i) => i.productId._id.toString())
        )
      ).size,
      returnsCancellations: orders.filter((o) =>
        ["Cancelled", "Returned"].includes(o.orderStatus)
      ).length,
      returnsCancellationsAmount: 0, // Calculate
      paymentMethods: [], // Calculate breakdown
      orderStatus: [], // Calculate breakdown
      topProducts: [], // Calculate top products
      transactions,
    },
  });
};
