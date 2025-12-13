import ExcelJS from "exceljs";

export const generateSalesReportExcel = async (res, salesData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Delivered Sales");

  // ---------------- HEADER ----------------
  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Order ID", key: "orderId", width: 20 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Items", key: "items", width: 10 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Discount", key: "discount", width: 15 },
    { header: "Payment Method", key: "payment", width: 20 },
  ];

  // ---------------- DATA ----------------
  salesData.transactions.forEach((t) => {
    sheet.addRow({
      date: new Date(t.createdAt).toLocaleDateString("en-IN"),
      orderId: t.orderId,
      customer: t.customerName,
      items: t.itemCount,
      amount: t.totalAmount,
      discount: t.discount,
      payment: t.paymentMethod,
    });
  });

  // ---------------- TOTAL ROW ----------------
  sheet.addRow({});
  sheet.addRow({
    customer: "TOTAL",
    amount: salesData.totalSales,
    discount: salesData.totalDiscounts,
  });

  // ---------------- RESPONSE ----------------
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=delivered-sales-report.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  await workbook.xlsx.write(res);
  res.end();
};
