// referral.service.js
import { REFERRER_REWARD } from "../../shared/constants/defaults.js";
import { findUserById, updateUserWalletBalance } from "../user/user.repo.js";
import { createLedgerEntry } from "../wallet/repo/wallet.ledger.repo.js";
import { findWalletByUserId, updateWalletBalanceAndCredit } from "../wallet/repo/wallet.repo.js";
import {
  findPendingReferralForUser,
  findReferralByReferredUser,
  updateReferralToCompleted,
  updateReferralToPending,
} from "./referral.repo.js";

export const markReferralAsPending = async (userId, orderId, session) => {
  const referral = await findReferralByReferredUser(userId, session);
  if (!referral) return;

  await updateReferralToPending(referral._id, orderId, session);
};


export const completeReferralReward = async (
  referredUserId,
  orderId,
  session
) => {

  
  //  Find referral that is still pending
  const referral = await findPendingReferralForUser(referredUserId,session);
  if (!referral) return;
  
  const referredUser=await findUserById(referredUserId,session);
  if(!referredUser)return;

  const referrerId = referral.referrer;

  //  Get wallet of referrer
  const wallet = await findWalletByUserId(referrerId,session);

  const newBalance = wallet.balance + REFERRER_REWARD;

  //  Update wallet
  await updateWalletBalanceAndCredit(referrerId, REFERRER_REWARD, session);

  await updateUserWalletBalance(referrerId,newBalance,session);

  // Ledger entry
  const ledger = await createLedgerEntry(
    {
      walletId: wallet._id,
      userId: referrerId,
      amount: REFERRER_REWARD,
      balanceAfter: newBalance,
      type: "REFERRAL",
      referenceId: orderId,
      note: `Referral reward credited by the user ${referredUser.username}`,
    },
    session
  );

  //  Update referral status
  await updateReferralToCompleted(referral._id, ledger._id, session);
};
