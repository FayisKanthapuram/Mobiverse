import { countCoupon, findCoupons, getTotalCouponUsage, getTotalDiscountGiven } from "../repo/coupon.repo.js";

// Coupon services - business logic for loading/listing coupons
export const loadCouponsService = async (queryParams) => {
  const currentPage = parseInt(queryParams.page) || 1;
  const statusFilter = queryParams.status || "";
  const sortFilter = queryParams.sort || "recent";
  const searchQuery = queryParams.search || "";
  const typeFilter = queryParams.type || "";

  const query = {};

  //search
  if (searchQuery) {
    query.$or = [
      { code: { $regex: searchQuery, $options: "i" } },
      { name: { $regex: searchQuery, $options: "i" } },
    ];
  }

  //type
  if (typeFilter) {
    query.type = typeFilter;
  }

  //status
  const now = new Date();
  if (statusFilter === "active") {
    query.isActive = true;
    query.startDate = { $lte: now };
    query.endDate = { $gte: now };
  } else if (statusFilter === "inactive") {
    query.isActive = false;
  } else if (statusFilter === "expired") {
    query.endDate = { $lt: now };
  }

  //sort
  let sortOption = {};
  switch (sortFilter) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "usage-high":
      sortOption = { currentUsageCount: -1 };
      break;
    case "usage-low":
      sortOption = { currentUsageCount: 1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  //pagination
  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const coupons = await findCoupons(query, sortOption, skip, limit);

  const totalCoupons = await countCoupon(query);
  const analytics = {
    totalCoupons: await countCoupon(),
    activeCoupons: await countCoupon({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }),
    expiredCoupons: await countCoupon({
      endDate: { $lt: now },
    }),
    totalUsage: await getTotalCouponUsage(),
    totalDiscountGiven: await getTotalDiscountGiven(),
  };

  return {
    analytics,
    coupons,
    searchQuery,
    typeFilter,
    statusFilter,
    sortFilter,
    currentPage,
    totalPages: Math.ceil(totalCoupons / limit),
    totalCoupons,
    limit:parseInt(limit),
  }
};
