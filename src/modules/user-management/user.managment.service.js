import {
  countAllUsers,
  countBlockedUsers,
  countFilteredUsers,
  findUser,
  findUsers,
} from "./user.managment.repo.js";
import {
  buildUserQuery,
  buildSortQuery,
  getPagination,
} from "./user.managment.helper.js";
import { findUserById } from "../user/user.repo.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { UserMessages } from "../../shared/constants/messages/userMessages.js";

/* ----------------------------------------------------
   LOAD USERS
---------------------------------------------------- */
export const loadUsersService = async (queryParams) => {
  const { page, search, status, sort } = queryParams;

  const searchQuery = search || "";
  const statusFilter = status || "";
  const sortBy = sort || "recent";

  const query = buildUserQuery({ searchQuery, statusFilter });
  const sortQuery = buildSortQuery(sortBy);
  const { currentPage, skip, limit } = getPagination(page);

  const totalCustomers = await countAllUsers();
  const blockedCount = await countBlockedUsers();
  const totalFiltered = await countFilteredUsers(query);

  const customers = await findUsers(query, skip, limit, sortQuery);
  const totalPages = Math.ceil(totalFiltered / limit);

  return {
    customers,
    totalCustomers,
    blockedCount,
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    sortBy,
    totalFiltered,
    totalPages,
  };
};

/* ----------------------------------------------------
   BLOCK / UNBLOCK USER
---------------------------------------------------- */
export const blockUserService = async (id) => {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError(UserMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return true;
};

/* ----------------------------------------------------
   SEARCH USERS
---------------------------------------------------- */
export const getCustomersBySearch = async (search = "") => {
  const query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return await findUser(query);
};
