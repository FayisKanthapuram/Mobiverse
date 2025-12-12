import Referral from "./referral.model.js";

export const createRefferalLog = (entry) => {
  return Referral.create(entry);
};

export const findReferralByReferredUser = (userId, session = null) => {
  return Referral.findOne(
    { referredUser: userId, status: "REGISTERED" },
    null,
    session ? { session } : {}
  );
};

export const updateReferralToPending = (
  referralId,
  orderId,
  session = null
) => {
  return Referral.findByIdAndUpdate(
    referralId,
    {
      status: "PENDING",
      firstOrder: orderId,
    },
    { new: true, ...(session ? { session } : {}) }
  );
};

export const findPendingReferralForUser = (userId, session = null) => {
  const options = session ? { session } : {};

  return Referral.findOne(
    {
      referredUser: userId,
      status: "PENDING",
      rewardCredited: false,
    },
    null,
    options
  );
};


export const updateReferralToCompleted = (referralId, ledgerId, session) => {
  return Referral.findByIdAndUpdate(
    referralId,
    {
      status: "COMPLETED",
      rewardCredited: true,
      rewardCreditedAt: new Date(),
      walletTransaction: ledgerId,
    },
    { session, new: true }
  );
};

