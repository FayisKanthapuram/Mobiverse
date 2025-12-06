import walletModel from "../models/walletModel.js";

export const findWalletByUserId = (userId) => {
  return walletModel.findOne({userId})
};
