import {
  findOrders,
  getTotalRevenue,
  countAllOrders,
  countActiveOrders,
  countReturnedOrders,
  countCancelledOrders,
} from "../../repo/order.repo.js";

export const loadOrdersService = async (queryParams) => {
  const currentPage = parseInt(queryParams.page) || 1;
  const statusFilter = queryParams.status || "";
  const paymentStatusFilter = queryParams.paymentStatus || "";
  const sortFilter = queryParams.sort || "recent";
  const searchQuery = queryParams.search || "";

  const query = {};

  if (statusFilter) query.orderStatus = statusFilter;
  if (paymentStatusFilter) query.paymentStatus = paymentStatusFilter;

  const sort = {};
  if (sortFilter === "recent") sort.createdAt = -1;
  else if (sortFilter === "oldest") sort.createdAt = 1;
  else if (sortFilter === "amount-high") sort.finalAmount = -1;
  else if (sortFilter === "amount-low") sort.finalAmount = 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  // -------------------------
  // FETCH ORDERS
  // -------------------------
  let orders = await findOrders(query, sort);

  // -------------------------
  // SERVER-SIDE SEARCH
  // -------------------------
  if (searchQuery) {
    const s = searchQuery.toLowerCase();
    orders = orders.filter(
      (order) =>
        order.orderId?.toLowerCase().includes(s) ||
        order.userId?.username?.toLowerCase().includes(s) ||
        order.userId?.email?.toLowerCase().includes(s)
    );
  }

  const totalOrders = orders.length;
  const totalPages = Math.ceil(totalOrders / limit);

  // Paginate results
  const paginatedOrders = orders.slice(skip, skip + limit);

  // -------------------------
  // ANALYTICS
  // -------------------------
  const [revenue] = await getTotalRevenue();
  const totalOrdersAnalitics = await countAllOrders();
  const activeOrders = await countActiveOrders();
  const returnedOrders = await countReturnedOrders();
  const cancelledOrders = await countCancelledOrders();

  return {
    analytics: {
      totalOrders: totalOrdersAnalitics,
      activeOrders,
      returnedOrders,
      cancelledOrders,
      totalRevenue: revenue?.total || 0,
    },
    orders: paginatedOrders,
    pagination: {
      currentPage,
      totalPages,
      limit,
      totalOrders,
    },
    filters: {
      statusFilter,
      paymentStatusFilter,
      sortFilter,
      searchQuery,
    },
  };
};
