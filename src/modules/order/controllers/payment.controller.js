import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { abandonPendingPaymentService, markRazorpayPaymentFailedService, verifyRazorpayPaymentService } from "../services/user/payment.service.js";

// Payment controller - handle payment verification endpoints
// Verify Razorpay payment
export const verifyRazorpayPayment = async (req, res) => {
  const appliedCoupon = req.session.appliedCoupon;
  const result = await verifyRazorpayPaymentService({
    razorpay_order_id: req.body.razorpay_order_id,
    razorpay_payment_id: req.body.razorpay_payment_id,
    razorpay_signature: req.body.razorpay_signature,
    tempOrderId: req.body.tempOrderId,
    userId: req.user._id,
    appliedCoupon,
  });
  req.session.appliedCoupon = null;

  return res.status(result.status).json(result);
};

export const abandonPendingPayment = async (req, res) => {
  await abandonPendingPaymentService(req.user._id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Pending payment cancelled. You can continue checkout.",
  });
};

export const markRazorpayPaymentFailed = async (req, res) => {
  const { tempOrderId } = req.body;
  const userId = req.user._id;

  await markRazorpayPaymentFailedService(tempOrderId, userId);

  res.status(HttpStatus.OK).json({
    success: true,
  });
};