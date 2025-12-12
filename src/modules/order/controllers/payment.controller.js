import { verifyRazorpayPaymentService } from "../services/user/payment.service.js";

export const verifyRazorpayPayment = async (req, res) => {
  const result = await verifyRazorpayPaymentService({
    razorpay_order_id: req.body.razorpay_order_id,
    razorpay_payment_id: req.body.razorpay_payment_id,
    razorpay_signature: req.body.razorpay_signature,
    tempOrderId: req.body.tempOrderId,
    userId: req.session.user,
  });

  return res.status(result.status).json(result);
};
