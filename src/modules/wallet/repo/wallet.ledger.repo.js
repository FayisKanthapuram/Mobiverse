import WalletLedger from "../models/wallet.ledger.model.js";

export const findFilteredTransationCount = (filter) => {
  return WalletLedger.countDocuments(filter);
};

export const findTransations = (filter, page, limit) => {
  return WalletLedger.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const findTransationByPaymentId = (razorpayPaymentId, type) => {
  return WalletLedger.findOne({ razorpayPaymentId, type });
};

export const createLedgerEntry = (entry, session = null) => {
  const options = session ? { session } : {};
  return WalletLedger.create([entry], options);
};
