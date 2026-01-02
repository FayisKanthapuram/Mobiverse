import {
  findOrders,
  getTotalRevenue,
  countAllOrders,
  countActiveOrders,
  countReturnedOrders,
  countCancelledOrders,
} from "../../repo/order.repo.js";

// Load orders service - handle admin order fetching and filtering
// Fetch and filter orders with pagination
export const loadOrdersService = async (queryParams) => {
  const returnRequested = queryParams.returnRequested || false;
  const currentPage = parseInt(queryParams.page) || 1;
  const statusFilter = queryParams.status || "";
  const paymentStatusFilter = queryParams.paymentStatus || "";
  const sortFilter = queryParams.sort || "recent";
  const searchQuery = queryParams.search || "";

  const query = {};

  // Handle return requested filter
  if (returnRequested === "true") {
    query["orderedItems.itemStatus"] = "ReturnRequested";
  }

  if (statusFilter) query.orderStatus = statusFilter;
  if (paymentStatusFilter) query.paymentStatus = paymentStatusFilter;

  const sort = {};
  if (sortFilter === "recent") sort.createdAt = -1;
  else if (sortFilter === "oldest") sort.createdAt = 1;
  else if (sortFilter === "amount-high") sort.finalAmount = -1;
  else if (sortFilter === "amount-low") sort.finalAmount = 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  // Fetch orders from repository
  let orders = await findOrders(query, sort);

  // Apply server-side search filter
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

  const paginatedOrders = orders.slice(skip, skip + limit);

  // Calculate analytics metrics
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
      returnRequested,
    },
  };
};

