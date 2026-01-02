import offerModel from "./offer.model.js";

// Offer repository - DB operations for offers

// Find offers with population and pagination
export const findAllOffers = (query = {}, skip, limit) => {
  return offerModel
    .find(query)
    .populate({
      path: "productID",
      populate: { path: "brandID" },
    })
    .populate("brandID")
    .skip(skip)
    .limit(limit)
    .lean();
};

// Count offers matching query
export const findOffersCount = (query = {}) => {
  return offerModel.countDocuments(query);
};

// Find single offer by id with population
export const findOfferById = (id) => {
  return offerModel
    .findById(id)
    .populate({
      path: "productID",
      populate: { path: "brandID" },
    })
    .populate("brandID")
    .lean();
};

// Find offer by name and type
export const findOfferByNameAndType = (offerName, offerType) => {
  return offerModel.findOne({ offerName, offerType });
};

// Create a new offer
export const createOffer = (data) => {
  return offerModel.create(data);
};

// Update offer by id
export const updateOfferById = (id, data) => {
  return offerModel.findByIdAndUpdate(id, data, { new: true });
};

// Delete offer by id
export const deleteOfferById = (id) => {
  return offerModel.deleteOne({ _id: id });
};

// Toggle offer active flag
export const toggleOfferStatus = async (id) => {
  const offer = await offerModel.findById(id);
  if (!offer) return null;

  offer.isActive = !offer.isActive;
  await offer.save();
  return offer;
};

// Get active product offers for given time
export const getAvailableProductOffers = async (now) => {
  return offerModel.find({
    offerType: "product",
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
  });
};

// Get active brand offers for given time
export const getAvailableBrandOffers = async (now) => {
  return offerModel.find({
    offerType: "brand",
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
  });
};
