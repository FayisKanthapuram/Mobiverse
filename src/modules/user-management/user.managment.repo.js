import userModel from "../user/user.model.js";

// User management repo - DB helpers for admin user queries

// Find users matching query
export const findUser = (query) => {
  return userModel.find(query);
};

// Count all users
export const countAllUsers = () => userModel.countDocuments();

// Count blocked users
export const countBlockedUsers = () =>
  userModel.countDocuments({ isBlocked: true });

// Count users matching a filter
export const countFilteredUsers = (query) => userModel.countDocuments(query);

// Find users with pagination and sorting
export const findUsers = (query, skip, limit, sort) =>
  userModel.find(query).skip(skip).limit(limit).sort(sort).lean();
