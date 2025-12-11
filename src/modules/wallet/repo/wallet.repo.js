import walletModel from "../models/wallet.model.js";

export const findWalletByUserId = (userId) => {
  return walletModel.findOne({ userId });
};

export const createWallet = (userId) => {
  return walletModel.create({
    userId
  });
};
