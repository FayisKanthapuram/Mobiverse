import Referral from "./referral.model.js";

// Referral repo - DB access helpers for referrals

// Create a referral log entry
export const createRefferalLog = (entry) => {
  return Referral.create(entry);
};

// Find a referral record by the referred user's id with REGISTERED status
export const findReferralByReferredUser = (userId, session = null) => {
  return Referral.findOne(
    { referredUser: userId, status: "REGISTERED" },
    null,
    session ? { session } : {}
  );
};

// Mark a referral as PENDING and attach the first order id
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

// Update the referral's firstOrder field
export const updateReferralOrderId = (referralId, orderId, session = null) => {
  return Referral.findByIdAndUpdate(
    referralId,
    {
      firstOrder: orderId,
    },
    { new: true, ...(session ? { session } : {}) }
  );
};

// Find a pending referral for a referred user (reward not yet credited)
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

// Mark referral as completed and attach ledger transaction
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

// Fetch referrals for a referrer with pagination
export const findReferralsByUserId = (referrer, skip, limit) => {
  return Referral.find({ referrer })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("referredUser");
};

// Count total referrals for a referrer
export const findTotalReferralsCount = (referrer) => {
  return Referral.countDocuments({ referrer });
};
