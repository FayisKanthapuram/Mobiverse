import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { deleteTempOrder } from "../repo/temp.order.repo.js";
import { verifyRazorpayPaymentService } from "../services/user/payment.service.js";

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

// Delete temporary order
export const deleteTemperoryOrder=async(req,res)=>{
  await deleteTempOrder(req.params.id);
  res.status(HttpStatus.OK).json({ success:true });
}