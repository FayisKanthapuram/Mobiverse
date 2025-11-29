import userModel from "../models/userModel.js";

export const findUserById = (userId) => {
  return userModel.findById(userId);
};
