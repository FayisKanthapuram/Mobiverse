// user.service.js
import {
  countAllUsers,
  countBlockedUsers,
  countFilteredUsers,
  findUsers,
} from "./user.managment.repo.js";

import {
  buildUserQuery,
  buildSortQuery,
  getPagination,
} from "./user.managment.helper.js";
import { findUserById } from "../user/user.repo.js";

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

export const blockUserService = async (id) => {
  const user = await findUserById(id);
  if (!user) return null;

  user.isBlocked = !user.isBlocked;
  await user.save();
  return user;
};

export const getCustomersBySearch=async(search="")=>{
  const query={}
  if(search) {
    query.$or=[
      {username:{$regex:search,$options:"i"}},
      {email:{$regex:search,$options:"i"}},
    ]
  }
  return await findUser(query);
}