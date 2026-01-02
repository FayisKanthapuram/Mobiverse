import Wallet from "../models/wallet.model.js";

// Wallet repo - DB helpers for wallet documents

// Find wallet by user id
export const findWalletByUserId = (userId, session = null) => {
  const options = session ? { session } : {};
  return Wallet.findOne({ userId }, null, options);
};

// Create a wallet for a user
export const createWallet = (userId, session = null) => {
  const options = session ? { session } : {};
  return Wallet.create([{ userId }], options);
};

// Increment/decrement hold balance
export const updateWalletHoldBalance = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    { $inc: { holdBalance: amount }, lastTransactionAt: new Date() },
    options
  );
};

// Increment total debits
export const updateWalletTotalDebits = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    { $inc: { totalDebits: amount }, lastTransactionAt: new Date() },
    options
  );
};

// Persist wallet document
export const saveWallet = (wallet, session = null) => {
  return wallet.save({ session });
};

// Update wallet balance and total credits
export const updateWalletBalanceAndCredit = (userId, amount, session = null) => {
  const options = session ? { session } : {};
  return Wallet.updateOne(
    { userId },
    {
      $inc: { balance: amount, totalCredits: amount },
      $set: { lastTransactionAt: new Date() },
    },
    options
  );
};