import userModel from "./user.model.js";

export const findUserById = (id, session = null) => {
  const options = session ? { session } : {};
  return userModel.findById(id, null, options);
};

export const findUserByEmail = (email) => {
  return userModel.findOne({ email });
};

export const saveUser = (user) => user.save();

export const updateUserWalletBalance = (_id, walletBalance, session = null) => {
  const options = session ? { session } : {};
  return userModel.updateOne({ _id }, { walletBalance }, options);
};

export const findUserByReferralId = (referralCode) => {
  return userModel.findOne({ referralCode });
};
