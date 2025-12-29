import { HttpStatus } from "../../shared/constants/statusCode.js";
import { createBannerService, deleteBannerService, getEditFormService, loadBannersService, reorderBannersService, toggleBannerStatusService, updateBannerService } from "./banners.service.js";
import { BannerMessages } from "../../shared/constants/messages/bannerMessages.js";

export const loadBanners = async (req, res) => {
  const banners = await loadBannersService();

  res.status(HttpStatus.OK).render("admin/banners/banners", {
    pageTitle: "Banners",
    pageJs: "banners",
    banners,
  });
};

export const getCreateForm = async (req, res) => {
  res.status(HttpStatus.OK).render("admin/banners/bannerForm", {
    pageTitle: "Create Banner",
    pageJs: "bannerForm",
    banner: null,
  });
};

export const getEditForm=async (req,res)=>{
  const banner = await getEditFormService(req.params.id);

  res.status(HttpStatus.OK).render("admin/banners/bannerForm", {
    pageTitle: "Edit Banner",
    pageJs: "bannerForm",
    banner,
  });
}


export const createBanner = async (req, res) => {
  const banner = await createBannerService(req.body, req.files);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: BannerMessages.BANNER_CREATED,
    banner,
  });
};


export const updateBanner = async (req, res) => {
  const banner = await updateBannerService(req.params.id, req.body, req.files);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_UPDATED,
    banner,
  });
};


export const toggleBannerStatus = async (req, res) => {
  await toggleBannerStatusService(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_STATUS_UPDATED,
  });
};

export const reorderBanners = async (req, res) => {
  await reorderBannersService(req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_ORDER_UPDATED,
  });
};

export const deleteBanner = async (req, res) => {
  await deleteBannerService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_DELETED,
  });
};