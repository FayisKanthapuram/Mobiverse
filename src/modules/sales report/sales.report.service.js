import { findOrdersByFilter } from "../order/repo/order.repo.js";

export const loadSalesReportService=async(data)=>{
  const { reportType, startDate, endDate, status, limit, currentPage } = data;
  let dateFilter = {};
  let weekStart, weekEnd;
  let monthStart, monthEnd;
  let yearStart, yearEnd;

  if (reportType === "custom" && startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  } else if (reportType === "daily") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    weekStart = today;
    weekEnd = today;

    dateFilter = { createdAt: { $gte: today } };
  } else if (reportType === "weekly") {
    weekEnd = new Date();
    weekEnd.setHours(23, 59, 59, 999);

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    dateFilter = {
      createdAt: { $gte: weekStart, $lte: weekEnd },
    };
  } else if (reportType === "monthly") {
    monthEnd = new Date();
    monthEnd.setHours(23, 59, 59, 999);

    monthStart = new Date(monthEnd);
    monthStart.setMonth(monthStart.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    dateFilter = {
      createdAt: { $gte: monthStart, $lte: monthEnd },
    };
  } else if (reportType === "yearly") {
    yearEnd = new Date();
    yearEnd.setHours(23, 59, 59, 999);

    yearStart = new Date(yearEnd);
    yearStart.setFullYear(yearStart.getFullYear() - 1);
    yearStart.setHours(0, 0, 0, 0);

    dateFilter = {
      createdAt: { $gte: yearStart, $lte: yearEnd },
    };
  }


  // Build status filter
  let statusFilterObj = {};
  if (status) {
    statusFilterObj = { orderStatus: status };
  }

  // Combine filters
  const filter = { ...dateFilter, ...statusFilterObj };

  // Fetch orders with filters
  const orders = await findOrdersByFilter(filter);
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => {
    // Calculate order total (same logic as your orders page)
    const orderTotal =
      order.orderedItems.reduce((itemSum, item) => {
        const price = item.price || 0;
        const offer = item.offer || 0;
        const effective = price - offer;
        return itemSum + effective * item.quantity;
      }, 0) - (order.couponDiscount || 0);
    return sum + orderTotal;
  }, 0);

  const totalDiscounts = orders.reduce((sum, order) => {
    const itemDiscounts = order.orderedItems.reduce((itemSum, item) => {
      const mrp = item.regularPrice || item.price;
      const selling = item.price - (item.offer || 0);
      const discount = (mrp - selling) * item.quantity;
      return itemSum + discount;
    }, 0);
    return sum + itemDiscounts + (order.couponDiscount || 0);
  }, 0);

  // Paginate transactions
  const skip = (currentPage - 1) * limit;
  const transactions = orders.slice(skip, skip + limit).map((order) => ({
    orderId: order.orderId,
    date: order.createdAt,
    customerName: order.userId.username,
    customerEmail: order.userId.email,
    itemCount: order.orderedItems.length,
    paymentMethod: order.paymentMethod,
    status: order.orderStatus,
    discount:
      (order.couponDiscount || 0) +
      order.orderedItems.reduce((sum, item) => {
        const mrp = item.regularPrice || item.price;
        const selling = item.price - (item.offer || 0);
        return sum + (mrp - selling) * item.quantity;
      }, 0),
    totalAmount:
      order.orderedItems.reduce((sum, item) => {
        const effective = item.price - (item.offer || 0);
        return sum + effective * item.quantity;
      }, 0) - (order.couponDiscount || 0),
  }));

  const totalPages = Math.ceil(totalOrders / limit);
  const salesGrowth=15.5;
  return {
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
  };
}