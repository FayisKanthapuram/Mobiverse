import { getDeliveredSalesReportService } from "./sales.report.service.js";
import { generateSalesReportExcel } from "./utils/sales.report.excel.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import puppeteer from "puppeteer";
import path from "path";

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
  const { reportType = "daily", startDate, endDate } = req.query;

  const MAX_EXCEL_LIMIT = 200000;

  const data = await getDeliveredSalesReportService({
    reportType,
    startDate,
    endDate,
    page: 1,
    limit: MAX_EXCEL_LIMIT, // fetch all
  });
  return generateSalesReportExcel(res, data.salesData);
};

/* ----------------------------------------------------
   RENDER SALES REPORT PDF PAGE
---------------------------------------------------- */
export const loadSalesReportPDF = async (req, res) => {
  const {
    reportType = "daily",
    startDate,
    endDate,
    limit = 1000, // ✅ DEFAULT SAFE LIMIT
  } = req.query;

  if (Number(limit) > 100000) {
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
    limit: Number(limit),
  });

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
    landscape: true, // ✅ THIS IS THE KEY
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
