import WalletLedger from "../models/wallet.ledger.model.js";

export const findFilteredTransationCount = (filter) => {
  return WalletLedger.countDocuments(filter);
};

export const findTransations = (filter, page, limit) => {
  return WalletLedger.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const findTransationByPaymentId = (razorpayPaymentId, type) => {
  return WalletLedger.findOne({ razorpayPaymentId, type });
};

export const createLedgerEntry = (entry) => {
  return WalletLedger.create(entry);
};

export const verifyPaymentService = async (data, userId) => {
  try {
    // Validate payload
    const { error } = razorpayPaymentValidation.validate(data);
    if (error) {
      throw {
        status: HttpStatus.BAD_REQUEST,
        message: error.details[0].message,
      };
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = data;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw {
        status: HttpStatus.NOT_ACCEPTABLE,
        message: "Payment Verification Failed ❌",
      };
    }

    // Convert paise to rupees
    const creditAmount = Number(amount) / 100;

    // Check duplicate payment
    const duplicate = await findWalletByPaymentId(razorpay_payment_id);
    if (duplicate) {
      throw {
        status: HttpStatus.OK,
        success: true,
        message: "Payment Already Processed ✔",
      };
    }

    // Ensure wallet exists
    let wallet = await findWalletByUserId(userId);
    if (!wallet) {
      wallet = await createWallet(userId);
    }

    const newBalance = wallet.balance + creditAmount;

    const transaction = {
      type: "credit",
      amount: creditAmount,
      description: "Wallet Top-up",
      paymentOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      balanceAfter: newBalance,
      createdAt: new Date(),
    };

    // Update wallet
    await updateWalletByUserId(userId, creditAmount, transaction);
    await updateUserWalletBalance(userId, newBalance);

    // SUCCESS
    return {
      status: HttpStatus.ACCEPTED,
      success: true,
      message: "Payment Verified & Wallet Credited ✔",
      newBalance,
      transaction,
    };
  } catch (err) {
    console.log("Service Error:", err);

    // Forward custom thrown errors
    if (err.status) {
      throw err;
    }

    // Unknown error
    throw {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Server Error ❌",
    };
  }
};
