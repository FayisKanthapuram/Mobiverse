import offerModel from "../models/offerModel.js";

export const findAllOffers = (query = {}) => {
  return offerModel.find(query).populate("productID").populate("brandID");
};

export const findOfferById = (id) => {
  return offerModel
    .findById(id)
    .populate({
      path: "productID",
      populate: { path: "brandID" },
    })
    .populate("brandID");
};

export const findOfferByNameAndType = (offerName, offerType) => {
  return offerModel.findOne({ offerName, offerType });
};

export const createOffer = (data) => {
  return offerModel.create(data);
};

export const updateOfferById = (id, data) => {
  return offerModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteOfferById = (id) => {
  return offerModel.deleteOne({ _id: id });
};

export const toggleOfferStatus = async (id) => {
  const offer = await offerModel.findById(id);
  if (!offer) return null;

  offer.isActive = !offer.isActive;
  await offer.save();
  return offer;
};

export const getAvailableProductOffers=async (now)=>{
  return offerModel.find({
    offerType:'product',
    startDate:{$lte:now},
    endDate:{$gte:now},
    isActive:true,
  })
}

export const getAvailableBrandOffers=async (now)=>{
  return offerModel.find({
    offerType:'brand',
    startDate:{$lte:now},
    endDate:{$gte:now},
    isActive:true,
  })
}
