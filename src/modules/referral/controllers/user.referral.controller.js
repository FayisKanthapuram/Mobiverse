import {
  NEW_USER_REWARD,
  REFERRER_REWARD,
} from "../../../shared/constants/defaults.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import {
  findReferralsByUserId,
  findTotalReferralsCount,
} from "../referral.repo.js";

export const laodRefferAndEarn = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const user = req.user;
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  const referrals = await findReferralsByUserId(user._id, skip, limit);
  let totalReferralEarnings = 0;
  let totalSuccessfulReferrals = 0;
  for (let referral of referrals) {
    if (referral.status === "COMPLETED") {
      totalReferralEarnings += referral.rewardAmount;
      totalSuccessfulReferrals++;
    }
  }
  const totalReferrals = await findTotalReferralsCount(user._id);
  res.status(HttpStatus.OK).render("user/referrals", {
    pageTitle: "Refer & Earn",
    pageJs: "referrals",
    user,
    referrals,
    totalPages: Math.ceil(totalReferrals / limit),
    currentPage,
    limit,
    totalReferrals,
    REFERRER_REWARD,
    NEW_USER_REWARD,
    totalReferralEarnings,
    totalSuccessfulReferrals,
  });
};
