import walletModel from "./wallet.model.js";

export const findWalletByUserId = (userId) => {
  return walletModel.findOne({userId})
};
