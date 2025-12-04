import { HttpStatus } from "../../constants/statusCode.js";
import { getCustomersBySearch } from "../../services/admin.customer.service.js";
import { addCouponService } from "../../services/coupon/add.coupon.service.js";
import { loadCouponsService } from "../../services/coupon/load.coupon.service.js";
import { couponSchema } from "../../validators/coupon.validator.js";

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

export const searchCustomer = async (req, res) => {
  try {
    const search = req.query.q || "";
    const users = await getCustomersBySearch(search);
    res.status(HttpStatus.OK).json({ success: true, users });
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
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
    console.log(req.body);
  } catch (error) {
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};
