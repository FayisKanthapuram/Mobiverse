import User from "../user/user.model.js";
import walletModel from "../wallet/wallet.model.js";

export const findUserByEmail = (email) => User.findOne({ email });

export const createUser = (data) => User.create(data);

export const createWallet = (userId) =>
  walletModel.create({ userId });

export const updateUserPassword = async (email, hashedPassword) => {
  const user = await User.findOne({ email });
  user.password = hashedPassword;
  return user.save();
};
