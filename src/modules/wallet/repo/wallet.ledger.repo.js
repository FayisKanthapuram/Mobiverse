import WalletLedger from "../models/wallet.ledger.model.js";

// Wallet ledger repo - ledger query helpers

// Count ledger entries matching a filter
export const findFilteredTransationCount = (filter) => {
  return WalletLedger.countDocuments(filter);
};

// Find ledger transactions with pagination
export const findTransations = (filter, page, limit) => {
  return WalletLedger.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Find a ledger entry by razorpay payment id
export const findTransationByPaymentId = (razorpayPaymentId, type) => {
  return WalletLedger.findOne({ razorpayPaymentId, type });
};

// Create a ledger entry
export const createLedgerEntry = (entry, session = null) => {
  const options = session ? { session } : {};
  return WalletLedger.create([entry], options);
};
