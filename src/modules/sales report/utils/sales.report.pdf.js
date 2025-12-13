import PDFDocument from "pdfkit";

export const generateSalesReportPDF = (res, salesData) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=delivered-sales-report.pdf"
  );

  doc.pipe(res);

  // ---------------- HEADER ----------------
  doc.fontSize(18).text("Delivered Sales Report", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(12);
  doc.text(`Total Sales: ₹${salesData.totalSales.toFixed(2)}`);
  doc.text(`Total Orders: ${salesData.totalOrders}`);
  doc.text(`Products Sold: ${salesData.productsSold}`);
  doc.text(`Total Discounts: ₹${salesData.totalDiscounts.toFixed(2)}`);
  doc.moveDown(1.5);

  // ---------------- TABLE HEADER ----------------
  doc
    .fontSize(10)
    .text("Date | Order ID | Customer | Items | Amount | Discount | Payment", {
      underline: true,
    });

  doc.moveDown(0.5);

  // ---------------- TABLE DATA ----------------
  salesData.transactions.forEach((t) => {
    doc.text(
      `${new Date(t.createdAt).toLocaleDateString("en-IN")} | #${t.orderId} | ${
        t.customerName
      } | ${t.itemCount} | ₹${t.totalAmount.toFixed(2)} | ₹${t.discount.toFixed(
        2
      )} | ${t.paymentMethod}`
    );
  });

  doc.end();
};
