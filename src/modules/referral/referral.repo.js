import referralModel from "./referral.model.js"

export const createRefferalLog = (entry) => {
  return referralModel.create(entry);
};