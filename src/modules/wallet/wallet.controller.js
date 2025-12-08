import { loadMyWalletService } from "./wallet.service.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const loadMyWallet = async (req, res) => {
  try {
    const {user,wallet}= await loadMyWalletService(req.session.user)
    res.status(HttpStatus.OK).render("user/wallet", {
      pageTitle: "My Wallet",
      wallet,
      query:{},
      transactions:{},
      user,
    });
  } catch (error) {
    next(error);
  }
};
