// services/offerService.js
import brandModel from "../models/brandModel.js";
import offerModal from "../models/offerModal.js";

export const getOfferPageDataService = async (
  offerType,
  searchQuery,
  statusFilter,
  sortFilter,
  currentPage
) => {
  const brands = await brandModel.find({ isListed: true });
  const offers = await offerModal
    .find({ offerType })
    .populate("productID")
    .populate("brandID");

  return {
    brands,
    analytics: {},
    offers,
    currentPage,
    totalPages: 5,
    totalOffers: 45,
    limit: 10,
    offerType,
    searchQuery,
    statusFilter,
    sortFilter,
  };
};

export const addOfferService = async (offerData) => {
  try {
    const existing = await offerModal.findOne({
      name: offerData.offerName,
      offerType: offerData.offerType,
    });

    if (existing) {
      const error = new Error("Offer already exists");
      error.status = 400;
      throw error;
    }

    // Create new offer
    await offerModal.create(offerData);
    return;
  } catch (error) {
    throw error;
  }
};

export const editOfferService = async (id, offerData) => {
  try {
    const offer = await offerModal.findById(id);
    if (offer.offerName !== offerData.offerName) {
      console.log(offer.offerName, offerData.offerName);
      const existing = await offerModal.findOne({
        offerName: offerData.offerName,
        offerType: offerData.offerType,
      });

      if (existing) {
        const error = new Error("Offer already exists");
        error.status = 400;
        throw error;
      }
    }
    await offerModal.findByIdAndUpdate(id, offerData);

    return;
  } catch (error) {
    throw error;
  }
};

export const getOfferByIdService = async (id) => {
  try {
    const offer = await offerModal
      .findById(id)
      .populate({
        path:'productID',
        populate:{
          path:"brandID",
        }
      })
      .populate('brandID')
    console.log(offer)
    if (!offer) {
      const error = new Error("Offer not found");
      error.status = 404;
      throw error;
    }

    return offer;
  } catch (error) {
    throw error;
  }
};

export const toggleOfferStatusService=async(id)=>{
  try {
    const offer=await offerModal.findById(id);
    if (!offer) {
      const error = new Error("Offer not found");
      error.status = 404;
      throw error;
    }
    offer.isActive=!offer.isActive;
    await offer.save();
    return;
  } catch (error) {
    throw error;
  }
}

export const deleteOfferStatusService=async(id)=>{
  try {
    const offer=await offerModal.findById(id);
    if (!offer) {
      const error = new Error("Offer not found");
      error.status = 404;
      throw error;
    }
    await offerModal.deleteOne({_id:id});
    return;
  } catch (error) {
    throw error;
  }
}
