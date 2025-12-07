import { HttpStatus } from "../../constants/statusCode.js";
import { addCouponService, editCouponService, getCouponService, loadCouponsService, toggleCouponStatusService,deleteCouponService} from "./services/index.js";
import { couponSchema } from "./coupon.validator.js";

export const loadCoupons = async (req, res, next) => {
  try {
    const {
      analytics,
      coupons,
      searchQuery,
      typeFilter,
      statusFilter,
      sortFilter,
      currentPage,
      totalPages,
      totalCoupons,
      limit,
    } = await loadCouponsService(req.query);

    res.render("admin/coupons", {
      pageTitle: "Coupons",
      pageCss: "coupons",
      pageJs: "coupons",
      analytics,
      coupons,
      searchQuery,
      typeFilter,
      statusFilter,
      sortFilter,
      currentPage,
      totalPages,
      totalCoupons,
      limit,
    });
  } catch (error) {
    next(error);
  }
};



export const addCoupon = async (req, res) => {
  try {
    const { error } = couponSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: error.details[0].message,
      });
    }
    await addCouponService(req.body)
    return res
      .status(200)
      .json({ success: true, message: "Offer added successfully" });

  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const editCoupon = async (req, res) => {
  try {
    const { error } = couponSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: error.details[0].message,
      });
    }
    await editCouponService(req.body,req.params.id)
    return res
      .status(200)
      .json({ success: true, message: "Offer editted successfully" });

  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

export const getCoupon=async(req,res)=>{
  try {
    const coupon=await getCouponService(req.params.id);
    return res
      .status(200)
      .json({ success: true, coupon });
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
}

export const toggleCouponStatus=async(req,res)=>{
  try {
    const coupon=await toggleCouponStatusService(req.params.id);
    const status=coupon.isActive?'Active':'Inactive'
    return res
      .status(200)
      .json({ success: true,message:`Coupon status has been updated to ${status}`});
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
}

export const deleteCoupon=async(req,res)=>{
  try {
    await deleteCouponService(req.params.id);
    return res
      .status(200)
      .json({ success: true,message:'Coupon deleted successfully'});
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
}