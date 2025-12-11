import Wallet from "../models/wallet.model.js";

export const findWalletByUserId = (userId, session = null) => {
  const options = session ? { session } : {};
  return Wallet.findOne({ userId }, null, options);
};

export const createWallet = (userId, session = null) => {
  const options = session ? { session } : {};
  return Wallet.create([{ userId }], options);
};

export const updateWalletBalance = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    { $inc: { balance: amount }, lastTransactionAt: new Date() },
    options
  );
};

export const updateWalletHoldBalance = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    { $inc: { holdBalance: amount }, lastTransactionAt: new Date() },
    options
  );
};

export const updateWalletTotalDebits = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    { $inc: { totalDebits: amount }, lastTransactionAt: new Date() },
    options
  );
};


export const saveWallet = (wallet, session=null) => {
  return wallet.save({session})
};