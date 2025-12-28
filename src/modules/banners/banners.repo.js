import bannerModel from "./banners.model.js";

export const findBanners = (sort = { order: 1, createdAt: -1 }) => {
  return bannerModel.find().sort(sort);
};

export const findBannerById = (id) => bannerModel.findById(id);

export const createBanner = (data) => bannerModel.create(data);

export const saveBanner = (banner) => banner.save();

export const updateBannerOrder = (id, order) =>
  bannerModel.findByIdAndUpdate(id, { order }, { new: true });


export const deleteBannerById=(id)=>{
  return bannerModel.findByIdAndDelete(id);
}