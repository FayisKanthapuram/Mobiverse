import userModel from "../../models/userModel.js";

export const loadCustomers = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const searchQuery = req.query.search || "";
  const statusFilter = req.query.status || "";
  const sortBy = req.query.sort || "recent";

  const query = {};
  if (statusFilter) {
    query.isBlocked = statusFilter !== "active";
  }
  if (searchQuery) {
    query.$or = [
      { username: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
    ];
  }

  const sort = {};
  if (sortBy === "recent") {
    sort.createdAt = 1;
  } else {
    sort.createdAt = -1;
  }

  const totalCustomersCound = await userModel.countDocuments().lean();
  const blockedCustomerCount = await userModel
    .countDocuments({ isBlocked: true })
    .lean();

  const limit = 3;
  const skip = (currentPage - 1) * limit;

  const customers = await userModel
    .find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .lean();
  const totalCustomersFiltered = await userModel.countDocuments(query).lean();
  const totalPages = Math.ceil(totalCustomersFiltered / limit);

  res.render("admin/customers", {
    pageTitle: "Customers",
    pageCss: "customers",
    pageJs: "customers",
    customers,
    totalCustomersCound,
    blockedCustomerCount,
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    sortBy,
    totalDocuments: totalCustomersFiltered,
    totalPages,
  });
};

export const blockCustomer = async (req, res) => {
  const { id } = req.params;
  const user = await userModel.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: "user not found" });
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.status(200).json({ success: true });
};
