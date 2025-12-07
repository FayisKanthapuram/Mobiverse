import userModel from "./user.model.js";

export const findUserById = (id) => {
  return userModel.findById(id);
};

export const findUserByEmail = (email) => {
  return userModel.findOne({ email });
};

export const saveUser = (user) => user.save();
