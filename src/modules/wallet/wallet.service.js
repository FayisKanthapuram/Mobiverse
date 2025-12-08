import { findUserById } from "../user/user.repo.js";
import { findWalletByUserId } from "./wallet.repo.js";

export const loadMyWalletService = async (userId) => {
  const user = await findUserById(userId);
  const wallet = await findWalletByUserId(userId);
  return { user, wallet };
};
