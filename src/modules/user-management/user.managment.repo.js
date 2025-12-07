import userModel from "../user/user.model.js";

export const findUser=(query)=>{
  return userModel.find(query);
}

export const countAllUsers = () => userModel.countDocuments();

export const countBlockedUsers = () =>
  userModel.countDocuments({ isBlocked: true });

export const countFilteredUsers = (query) => userModel.countDocuments(query);

export const findUsers = (query, skip, limit, sort) =>
  userModel.find(query).skip(skip).limit(limit).sort(sort).lean();
