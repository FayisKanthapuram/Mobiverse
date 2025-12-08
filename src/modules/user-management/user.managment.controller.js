// user.controller.js
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { loadUsersService, blockUserService, getCustomersBySearch } from "./user.managment.service.js";

export const loadUsers = async (req, res, next) => {
  try {
    const data = await loadUsersService(req.query);

    res.status(HttpStatus.OK).render("admin/users", {
      pageTitle: "Users",
      pageCss: "users",
      pageJs: "users",
      customers: data.customers,
      totalCustomersCound: data.totalCustomers,
      blockedCustomerCount: data.blockedCount,
      currentPage: data.currentPage,
      limit: data.limit,
      searchQuery: data.searchQuery,
      statusFilter: data.statusFilter,
      sortBy: data.sortBy,
      totalDocuments: data.totalFiltered,
      totalPages: data.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const blockUsers = async (req, res, next) => {
  try {
    const user = await blockUserService(req.params.id);

    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    res.status(HttpStatus.OK).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const searchUser = async (req, res) => {
  try {
    const search = req.query.q || "";
    const users = await getCustomersBySearch(search);
    res.status(HttpStatus.OK).json({ success: true, users });
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};
