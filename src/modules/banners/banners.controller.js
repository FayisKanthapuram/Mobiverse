import { HttpStatus } from "../../shared/constants/statusCode.js";
import { createBannerService, deleteBannerService, getEditFormService, loadBannersService, reorderBannersService, toggleBannerStatusService, updateBannerService } from "./banners.service.js";
import { BannerMessages } from "../../shared/constants/messages/bannerMessages.js";

// Banners controller - handle admin banner HTTP endpoints

// Render banners list
export const loadBanners = async (req, res) => {
  const banners = await loadBannersService();

  res.status(HttpStatus.OK).render("admin/banners/banners", {
    pageTitle: "Banners",
    pageJs: "banners",
    banners,
  });
};

// Render create banner form
export const getCreateForm = async (req, res) => {
  res.status(HttpStatus.OK).render("admin/banners/bannerForm", {
    pageTitle: "Create Banner",
    pageJs: "bannerForm",
    banner: null,
  });
};

// Render edit banner form
export const getEditForm=async (req,res)=>{
  const banner = await getEditFormService(req.params.id);

  res.status(HttpStatus.OK).render("admin/banners/bannerForm", {
    pageTitle: "Edit Banner",
    pageJs: "bannerForm",
    banner,
  });
}


// Create a new banner
export const createBanner = async (req, res) => {
  const banner = await createBannerService(req.body, req.files);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: BannerMessages.BANNER_CREATED,
    banner,
  });
};


// Update an existing banner
export const updateBanner = async (req, res) => {
  const banner = await updateBannerService(req.params.id, req.body, req.files);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_UPDATED,
    banner,
  });
};


// Toggle banner active status
export const toggleBannerStatus = async (req, res) => {
  await toggleBannerStatusService(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_STATUS_UPDATED,
  });
};

// Reorder multiple banners
export const reorderBanners = async (req, res) => {
  await reorderBannersService(req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_ORDER_UPDATED,
  });
};

// Delete a banner
export const deleteBanner = async (req, res) => {
  await deleteBannerService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BannerMessages.BANNER_DELETED,
  });
};