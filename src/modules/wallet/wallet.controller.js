import { loadMyWalletService } from "./wallet.service.js";

export const loadMyWallet = async (req, res) => {
  try {
    const {user,wallet}= await loadMyWalletService(req.session.user)
    res.render("user/wallet", {
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
