import Coupon from "../../models/couponModel.js"
import CouponUsage from "../../models/couponUsageModel.js"

export const loadCoupons = async (req, res) => {
  try {
    const {
      search = '',
      type = '',
      status = '',
      sort = 'recent',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    // Search by code or name
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    const now = new Date();
    if (status === 'active') {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.endDate = { $lt: now };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'usage-high':
        sortOption = { currentUsageCount: -1 };
        break;
      case 'usage-low':
        sortOption = { currentUsageCount: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch coupons
    const coupons = await Coupon.find(query)
      .populate('specificUsers', 'username email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCoupons = await Coupon.countDocuments(query);

    // Analytics
    const analytics = {
      totalCoupons: await Coupon.countDocuments(),
      activeCoupons: await Coupon.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      }),
      expiredCoupons: await Coupon.countDocuments({
        endDate: { $lt: now }
      }),
      totalUsage: await Coupon.aggregate([
        { $group: { _id: null, total: { $sum: '$currentUsageCount' } } }
      ]).then(result => result[0]?.total || 0),
      totalDiscountGiven: await CouponUsage.aggregate([
        { $group: { _id: null, total: { $sum: '$discountAmount' } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.render('admin/coupons', {
      pageTitle: 'Coupons',
      pageCss: 'coupons',
      pageJs: 'coupons',
      analytics,
      coupons,
      searchQuery: search,
      typeFilter: type,
      statusFilter: status,
      sortFilter: sort,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCoupons / limit),
      totalCoupons,
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).render('error', { message: 'Failed to load coupons' });
  }
};
