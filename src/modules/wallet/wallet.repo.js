import walletModel from "./wallet.model.js";

export const findWalletByUserId = (userId) => {
  return walletModel.findOne({ userId });
};

export const createWallet = (userId) => {
  return walletModel.create({
    userId,
    balance: 0,
    transactions: [],
  });
};

export const findWalletByPaymentId = (paymentId) => {
  return walletModel.findOne({
    "transactions.paymentId": paymentId,
  });
};

export const updateWalletByUserId = (userId, creditAmount, transaction) => {
  return walletModel.updateOne(
    { userId },
    {
      $inc: { balance: creditAmount, totalCredits: creditAmount },
      $push: { transactions: transaction },
    }
  );
};
