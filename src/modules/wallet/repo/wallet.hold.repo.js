import WalletHold from "../models/wallet.hold.model.js";

export const createHoldRecord = (data, session = null) => {
  const options = session ? { session } : {};
  return WalletHold.create([data], options);
};

export const findHoldById = (holdId, session = null) => {
  const query = WalletHold.findById(holdId);
  if (session) query.session(session);
  return query;
};


export const updateHoldStatus = (holdId, status, session = null) => {
  const options = session ? { session } : {};
  return WalletHold.updateOne({ _id: holdId }, { status }, options);
};
