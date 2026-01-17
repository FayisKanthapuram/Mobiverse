import { getDeliveredSalesReportService } from "./sales.report.service.js";
import { generateSalesReportExcel } from "./utils/sales.report.excel.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import puppeteer from "puppeteer";

// Sales report controller - admin report endpoints
// Render sales report page
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

// Download sales report (Excel)
export const loadSalesReportDownload = async (req, res) => {
  const { reportType = "daily", startDate, endDate } = req.query;

  const MAX_EXCEL_LIMIT = 200000;

  const data = await getDeliveredSalesReportService({
    reportType,
    startDate,
    endDate,
    page: 1,
    limit: MAX_EXCEL_LIMIT,
  });

  // ✅ HANDLE NO SALES CASE
  if (
    !data.salesData.transactions ||
    data.salesData.transactions.length === 0
  ) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: "No sales data available for the selected period",
    });
  }

  return generateSalesReportExcel(res, data.salesData);
};


// Render sales report PDF page
export const loadSalesReportPDF = async (req, res) => {
  let { reportType = "daily", startDate, endDate, limit = 1000 } = req.query;

  limit = Number(limit);

  // ✅ VALIDATE LIMIT
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new AppError(
      "Limit must be a positive number",
      HttpStatus.BAD_REQUEST
    );
  }

  if (limit > 100000) {
    throw new AppError(
      "Maximum PDF download limit exceeded",
      HttpStatus.BAD_REQUEST
    );
  }

  const data = await getDeliveredSalesReportService({
    reportType,
    startDate,
    endDate,
    page: 1,
    limit,
  });

  // ✅ NO SALES → STOP EARLY
  if (
    !data.salesData.transactions ||
    data.salesData.transactions.length === 0
  ) {
    throw new AppError(
      "No sales data available for the selected period",
      HttpStatus.BAD_REQUEST
    );
  }

  // ✅ GENERATE PDF ONLY IF DATA EXISTS
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const html = await new Promise((resolve, reject) => {
    res.render(
      "admin/sales-report-pdf",
      {
        layout: false,
        salesData: data.salesData,
        reportType,
        startDate,
        endDate,
      },
      (err, html) => {
        if (err) reject(err);
        else resolve(html);
      }
    );
  });

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: {
      top: "15mm",
      bottom: "15mm",
      left: "12mm",
      right: "12mm",
    },
  });

  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="sales-report-${Date.now()}.pdf"`,
    "Content-Length": pdfBuffer.length,
  });

  res.end(pdfBuffer);
};


