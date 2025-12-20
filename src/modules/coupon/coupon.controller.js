import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  addCouponService,
  editCouponService,
  getCouponService,
  loadCouponsService,
  toggleCouponStatusService,
  deleteCouponService,
} from "./services/index.js";
import { couponSchema } from "./coupon.validator.js";
import { AppError } from "../../shared/utils/app.error.js";
import { CouponMessages } from "../../shared/constants/messages/couponMessages.js";

/* ----------------------------------------------------
   LOAD COUPONS PAGE
---------------------------------------------------- */
export const loadCoupons = async (req, res) => {
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

  res.status(HttpStatus.OK).render("admin/coupons", {
    pageTitle: "Coupons",
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
};

/* ----------------------------------------------------
   ADD COUPON
---------------------------------------------------- */
export const addCoupon = async (req, res) => {
  const { error } = couponSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await addCouponService(req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: CouponMessages.COUPON_ADDED,
  });
};

/* ----------------------------------------------------
   EDIT COUPON
---------------------------------------------------- */
export const editCoupon = async (req, res) => {
  const { error } = couponSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await editCouponService(req.body, req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: CouponMessages.COUPON_UPDATED,
  });
};

/* ----------------------------------------------------
   GET COUPON BY ID
---------------------------------------------------- */
export const getCoupon = async (req, res) => {
  const coupon = await getCouponService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    coupon,
  });
};

/* ----------------------------------------------------
   TOGGLE COUPON STATUS
---------------------------------------------------- */
export const toggleCouponStatus = async (req, res) => {
  const coupon = await toggleCouponStatusService(req.params.id);
  const status = coupon.isActive ? "Active" : "Inactive";

  res.status(HttpStatus.OK).json({
    success: true,
    message: CouponMessages.COUPON_STATUS_UPDATED.replace("{status}", status),
  });
};

/* ----------------------------------------------------
   DELETE COUPON
---------------------------------------------------- */
export const deleteCoupon = async (req, res) => {
  await deleteCouponService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: CouponMessages.COUPON_DELETED,
  });
};
