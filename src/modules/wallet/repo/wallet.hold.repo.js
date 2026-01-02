import WalletHold from "../models/wallet.hold.model.js";

// Wallet hold repo - helpers for temporary hold records

// Create a hold record for a pending transaction
export const createHoldRecord = (data, session = null) => {
  const options = session ? { session } : {};
  return WalletHold.create([data], options);
};

// Find hold record by id
export const findHoldById = (holdId, session = null) => {
  const query = WalletHold.findById(holdId);
  if (session) query.session(session);
  return query;
};

// Update hold status (HELD/CAPTURED/RELEASED)
export const updateHoldStatus = (holdId, status, session = null) => {
  const options = session ? { session } : {};
  return WalletHold.updateOne({ _id: holdId }, { status }, options);
};
