import cloudinary from "../../config/cloudinary.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { BannerMessages } from "../../shared/constants/messages/bannerMessages.js";
import { cloudinaryUpload } from "../../shared/middlewares/upload.js";
import { AppError } from "../../shared/utils/app.error.js";
import { rollbackCloudinary } from "../product/helpers/admin.product.helper.js";
import { toISTDate } from "./banner.helper.js";
import {
  createBanner,
  deleteBannerById,
  findBannerById,
  findBannerCount,
  findBanners,
  saveBanner,
  shiftBannerOrders,
  updateBannerOrder,
} from "./banners.repo.js";
// Banners service - business logic for banner management
export const loadBannersService = async () => {
  const banners = await findBanners();
  return banners;
};

// Create a banner with image uploads
export const createBannerService = async (body, files) => {
  const uploadedPublicIds = [];

  try {
    if (!files?.imageDesktop) {
      throw new AppError(
        BannerMessages.DESKTOP_IMAGE_REQUIRED,
        HttpStatus.BAD_REQUEST
      );
    }

    // Upload desktop (required)
    const desktopUpload = await cloudinaryUpload(
      files.imageDesktop[0].buffer,
      "banners"
    );
    uploadedPublicIds.push(desktopUpload.public_id);

    // Upload tablet (optional)
    let tabletUrl = "";
    if (files.imageTablet) {
      const tabletUpload = await cloudinaryUpload(
        files.imageTablet[0].buffer,
        "banners"
      );
      uploadedPublicIds.push(tabletUpload.public_id);
      tabletUrl = tabletUpload.secure_url;
    }

    // Upload mobile (optional)
    let mobileUrl = "";
    if (files.imageMobile) {
      const mobileUpload = await cloudinaryUpload(
        files.imageMobile[0].buffer,
        "banners"
      );
      uploadedPublicIds.push(mobileUpload.public_id);
      mobileUrl = mobileUpload.secure_url;
    }

    let order = Number(body.order) || 1;
    await shiftBannerOrders(order);
    const bannerCount = await findBannerCount();
    if(bannerCount+1<order)order=bannerCount+1;

    const bannerData = {
      title: body.title,
      subtitle: body.subtitle,
      link: body.link || "",
      images: {
        desktop: desktopUpload.secure_url,
        tablet: tabletUrl,
        mobile: mobileUrl,
      },
      order: order,
      isActive: body.isActive === "true" || body.isActive === true,
      isScheduled: body.isScheduled === "true" || body.isScheduled === true,
      scheduledStart: toISTDate(body.scheduledStart),
      scheduledEnd: toISTDate(body.scheduledEnd),
    };

    return await createBanner(bannerData);
  } catch (err) {
    await rollbackCloudinary(uploadedPublicIds);
    throw err;
  }
};

// Fetch banner for edit form
export const getEditFormService = async (id) => {
  const banner = await findBannerById(id);
  return banner;
};

// Update banner including images and order
export const updateBannerService = async (bannerId, body, files) => {
  const banner = await findBannerById(bannerId);

  if (!banner) {
    throw new AppError(BannerMessages.BANNER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // ---- BASIC FIELD UPDATES ----
  banner.title = body.title ?? banner.title;
  banner.subtitle = body.subtitle ?? banner.subtitle;
  banner.link = body.link ?? banner.link;
  banner.isActive = body.isActive === "true" || body.isActive === true;
  banner.isScheduled = body.isScheduled === "true" || body.isScheduled === true;

  const newOrder = Number(body.order ?? banner.order);

  if (newOrder !== banner.order) {
    const bannerCount=await findBannerCount()
    if (newOrder < banner.order){
      await shiftBannerOrders(newOrder, banner._id, banner.order);
      banner.order = newOrder;
    }
    else if(bannerCount+1>newOrder){
      await shiftBannerOrders(banner.order + 1, null, newOrder+1, -1);
      banner.order = newOrder;
    }
    else {
      await shiftBannerOrders(banner.order+1,null,bannerCount+1,-1)
      banner.order=bannerCount;
    }
  }

  if (banner.isScheduled) {
    banner.scheduledStart = toISTDate(body.scheduledStart);
    banner.scheduledEnd = toISTDate(body.scheduledEnd);
  } else {
    banner.scheduledStart = null;
    banner.scheduledEnd = null;
  }

  // ---- IMAGE REPLACEMENT (Cloudinary-safe) ----

  // Desktop (required image – replace if provided)
  if (files?.imageDesktop?.[0]) {
    const upload = await cloudinaryUpload(
      files.imageDesktop[0].buffer,
      "banners"
    );

    if (banner.images.desktop) {
      const publicId = banner.images.desktop.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/banners/${publicId}`);
    }

    banner.images.desktop = upload.secure_url;
  }

  // Tablet (optional)
  if (files?.imageTablet?.[0]) {
    const upload = await cloudinaryUpload(
      files.imageTablet[0].buffer,
      "banners"
    );

    if (banner.images.tablet) {
      const publicId = banner.images.tablet.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/banners/${publicId}`);
    }

    banner.images.tablet = upload.secure_url;
  }

  // Mobile (optional)
  if (files?.imageMobile?.[0]) {
    const upload = await cloudinaryUpload(
      files.imageMobile[0].buffer,
      "banners"
    );

    if (banner.images.mobile) {
      const publicId = banner.images.mobile.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ecommerce/banners/${publicId}`);
    }

    banner.images.mobile = upload.secure_url;
  }

  await saveBanner(banner);
  return banner;
};

// Toggle active status of a banner
export const toggleBannerStatusService = async (bannerId, body) => {
  const { isActive } = body;

  const banner = await findBannerById(bannerId);
  if (!banner) {
    throw new AppError("Banner not found", HttpStatus.NOT_FOUND);
  }

  banner.isActive = isActive === "true" || isActive === true;
  await saveBanner(banner);
};

// Reorder banners in bulk
export const reorderBannersService = async (body) => {
  const { banners } = body;

  if (!Array.isArray(banners)) {
    throw new AppError(BannerMessages.INVALID_DATA_FORMAT, HttpStatus.BAD_REQUEST);
  }

  await Promise.all(
    banners.map(({ id, order }) => {
      if (!id || typeof order !== "number") return null;
      return updateBannerOrder(id, order);
    })
  );
};

// Delete banner and its images
export const deleteBannerService = async (bannerId) => {
  const banner = await findBannerById(bannerId);

  if (!banner) {
    throw new AppError(BannerMessages.BANNER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Collect image URLs
  const images = [
    banner.images?.desktop,
    banner.images?.tablet,
    banner.images?.mobile,
  ].filter(Boolean);

  // Delete from Cloudinary
  for (const url of images) {
    const publicId = url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`ecommerce/banners/${publicId}`);
  }

  await shiftBannerOrders(banner.order+1,null,Infinity,-1);

  await deleteBannerById(bannerId);
};
