import { getDeliveredSalesReportService } from "./sales.report.service.js";
import { generateSalesReportExcel } from "./utils/sales.report.excel.js";

export const loadSalesReport = async (req, res,next) => {
  try {
    const {
      reportType = "daily",
      startDate,
      endDate,
      page = 1,
      limit = 4,
    } = req.query;
  
    const data = await getDeliveredSalesReportService({
      reportType,
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit),
    });
  
    res.render("admin/sales-report", {
      pageTitle: "Sales Report",
      pageCss: "sales-report",
      pageJs: "sales-report",
      ...data,
      reportType,
      startDate,
      endDate,
    });
  } catch (error) {
    next(error)
  }
};

export const loadSalesReportDownload = async (req, res, next) => {
  try {
    const {
      reportType = "daily",
      startDate,
      endDate,
      format = "pdf",
    } = req.query;

    // fetch ALL data (no pagination)
    const data = await getDeliveredSalesReportService({
      reportType,
      startDate,
      endDate,
      page: 1,
      limit: 100000, // big number to fetch all
    });

    if (format === "pdf") {
      return generateSalesReportPDF(res, data.salesData);
    }

    if (format === "excel") {
      return generateSalesReportExcel(res, data.salesData);
    }

    res.status(400).send("Invalid format");
  } catch (error) {
    next(error);
  }
};

export const loadSalesReportPDF = async (req, res, next) => {
  try {
    const { reportType = "daily", startDate, endDate } = req.query;

    const data = await getDeliveredSalesReportService({
      reportType,
      startDate,
      endDate,
      page: 1,
      limit: 100000, // all data
    });

    res.render("admin/sales-report-pdf", {
      layout: false, // IMPORTANT
      salesData: data.salesData,
      reportType,
      startDate,
      endDate,
    });
  } catch (err) {
    next(err);
  }
};
