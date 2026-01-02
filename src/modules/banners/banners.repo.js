import bannerModel from "./banners.model.js";

// Banners repository - DB operations for banners

// Find banners with optional sort
export const findBanners = (sort = { order: 1, createdAt: -1 }) => {
  return bannerModel.find().sort(sort);
};

// Find banner by id
export const findBannerById = (id) => bannerModel.findById(id);

// Create a banner document
export const createBanner = (data) => bannerModel.create(data);

// Save changes to a banner instance
export const saveBanner = (banner) => banner.save();

// Update banner order
export const updateBannerOrder = (id, order) =>
  bannerModel.findByIdAndUpdate(id, { order }, { new: true });

// Delete banner by id
export const deleteBannerById = (id) => {
  return bannerModel.findByIdAndDelete(id);
};

// Count banners
export const findBannerCount = () => bannerModel.countDocuments();

// Shift banner orders in a range (used when inserting/reordering)
export const shiftBannerOrders = (
  fromOrder,
  excludeId = null,
  toOrder = Infinity,
  incrementBy=1,
) => {
  const query = {
    order: { $gte: fromOrder, $lt: toOrder },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return bannerModel.updateMany(query, {
    $inc: { order: incrementBy },
  });
};
