import { HttpStatus } from "../../shared/constants/statusCode.js";
import { UserManagementMessages } from "../../shared/constants/messages/userManagementMessages.js";
import {
  loadUsersService,
  blockUserService,
  getCustomersBySearch,
} from "./user.managment.service.js";

// User management controller - admin user operations
// Render users listing page
export const loadUsers = async (req, res) => {
  const data = await loadUsersService(req.query);

  res.status(HttpStatus.OK).render("admin/users", {
    pageTitle: "Users",
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
};

// Toggle block/unblock for a user
export const blockUsers = async (req, res) => {
  await blockUserService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: UserManagementMessages.USER_STATUS_UPDATED,
  });
};

// Search users (AJAX)
export const searchUser = async (req, res) => {
  const search = req.query.q || "";

  const users = await getCustomersBySearch(search);

  res.status(HttpStatus.OK).json({
    success: true,
    users,
  });
};
