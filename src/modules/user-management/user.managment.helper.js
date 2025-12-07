// user.helper.js

export const buildUserQuery = ({ searchQuery, statusFilter }) => {
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

  return query;
};

export const buildSortQuery = (sortBy) => {
  return sortBy === "recent" ? { createdAt: 1 } : { createdAt: -1 };
};

export const getPagination = (page, limit = 3) => {
  const currentPage = parseInt(page) || 1;
  const skip = (currentPage - 1) * limit;

  return { currentPage, skip, limit };
};
