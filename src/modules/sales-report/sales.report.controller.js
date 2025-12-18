import { getDeliveredSalesReportService } from "./sales.report.service.js";
import { generateSalesReportExcel } from "./utils/sales.report.excel.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";

/* ----------------------------------------------------
   LOAD SALES REPORT PAGE
---------------------------------------------------- */
export const loadSalesReport = async (req, res) => {
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

  res.status(HttpStatus.OK).render("admin/sales-report", {
    pageTitle: "Sales Report",
    pageJs: "sales-report",
    ...data,
    reportType,
    startDate,
    endDate,
  });
};

/* ----------------------------------------------------
   DOWNLOAD SALES REPORT (EXCEL)
---------------------------------------------------- */
export const loadSalesReportDownload = async (req, res) => {
  const {
    reportType = "daily",
    startDate,
    endDate,
    format = "excel",
  } = req.query;

  const data = await getDeliveredSalesReportService({
    reportType,
    startDate,
    endDate,
    page: 1,
    limit: 100000, // fetch all
  });

  if (format === "excel") {
    return generateSalesReportExcel(res, data.salesData);
  }

  throw new AppError("Invalid format", HttpStatus.BAD_REQUEST);
};

/* ----------------------------------------------------
   RENDER SALES REPORT PDF PAGE
---------------------------------------------------- */
export const loadSalesReportPDF = async (req, res) => {
  const { reportType = "daily", startDate, endDate } = req.query;

  const data = await getDeliveredSalesReportService({
    reportType,
    startDate,
    endDate,
    page: 1,
    limit: 100000,
  });

  res.status(HttpStatus.OK).render("admin/sales-report-pdf", {
    layout: false,
    salesData: data.salesData,
    reportType,
    startDate,
    endDate,
  });
};
