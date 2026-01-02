import userModel from "./user.model.js";

// User repo - database helpers for users

// Find user by id
export const findUserById = (id, session = null) => {
  const options = session ? { session } : {};
  return userModel.findById(id, null, options);
};

// Find user by email
export const findUserByEmail = (email) => {
  return userModel.findOne({ email });
};

// Persist user document
export const saveUser = (user) => user.save();

// Update user's wallet balance
export const updateUserWalletBalance = (_id, walletBalance, session = null) => {
  const options = session ? { session } : {};
  return userModel.updateOne({ _id }, { walletBalance }, options);
};

// Find user by referral code
export const findUserByReferralId = (referralCode) => {
  return userModel.findOne({ referralCode });
};
