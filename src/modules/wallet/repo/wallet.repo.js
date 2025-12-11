import walletModel from "../models/wallet.model.js";

export const findWalletByUserId = (userId,session=null) => {
  return walletModel.findOne({ userId }).session(session);
};

export const createWallet = (userId, session = null) => {
  return walletModel.create([{ userId }], { session });
};

export const saveWallet = (wallet, session=null) => {
  return wallet.save({session})
};