import cloudinary from "../../config/cloudinary.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { cloudinaryUpload } from "../../shared/middlewares/upload.js";
import { AppError } from "../../shared/utils/app.error.js";
import { rollbackCloudinary } from "../product/helpers/admin.product.helper.js";
import { createBanner, deleteBannerById, findBannerById, findBanners, saveBanner, updateBannerOrder } from "./banners.repo.js";

export const loadBannersService = async () => {
	const banners = await findBanners();
	return banners;
};

export const createBannerService = async (body, files) => {
  const uploadedPublicIds = [];

  try {
    if (!files?.imageDesktop) {
      throw new AppError(
        "Desktop banner image is required",
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

    const bannerData = {
      title: body.title,
      subtitle: body.subtitle,
      link: body.link || "",
      images: {
        desktop: desktopUpload.secure_url,
        tablet: tabletUrl,
        mobile: mobileUrl,
      },
      backgroundColor: body.backgroundColor || "#1f2937",
      order: Number(body.order) || 1,
      isActive: body.isActive === "true" || body.isActive === true,
      isScheduled: body.isScheduled === "true" || body.isScheduled === true,
      scheduledStart: body.scheduledStart
        ? new Date(body.scheduledStart)
        : null,
      scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
    };

    return await createBanner(bannerData);
  } catch (err) {
    await rollbackCloudinary(uploadedPublicIds);
    throw err;
  }
};

export const getEditFormService=async(id)=>{
  const banner = await findBannerById(id);
  return banner;
}

export const updateBannerService = async (bannerId, body, files) => {
  const banner = await findBannerById(bannerId);

  if (!banner) {
    throw new AppError("Banner not found", HttpStatus.NOT_FOUND);
  }

  // ---- BASIC FIELD UPDATES ----
  banner.title = body.title ?? banner.title;
  banner.subtitle = body.subtitle ?? banner.subtitle;
  banner.link = body.link ?? banner.link;
  banner.backgroundColor = body.backgroundColor ?? banner.backgroundColor;
  banner.order = Number(body.order ?? banner.order);
  banner.isActive = body.isActive === "true" || body.isActive === true;
  banner.isScheduled = body.isScheduled === "true" || body.isScheduled === true;

  if (banner.isScheduled) {
    banner.scheduledStart = body.scheduledStart
      ? new Date(body.scheduledStart)
      : null;
    banner.scheduledEnd = body.scheduledEnd
      ? new Date(body.scheduledEnd)
      : null;
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

export const toggleBannerStatusService = async (bannerId, body) => {
  const { isActive } = body;

  const banner = await findBannerById(bannerId);
  if (!banner) {
    throw new AppError("Banner not found", HttpStatus.NOT_FOUND);
  }

  banner.isActive = isActive === "true" || isActive === true;
  await saveBanner(banner);
};


export const reorderBannersService = async (body) => {
  const { banners } = body;

  if (!Array.isArray(banners)) {
    throw new AppError("Invalid data format", HttpStatus.BAD_REQUEST);
  }

  await Promise.all(
    banners.map(({ id, order }) => {
      if (!id || typeof order !== "number") return null;
      return updateBannerOrder(id,order)
    })
  );
};

export const deleteBannerService = async (bannerId) => {
  const banner = await findBannerById(bannerId)

  if (!banner) {
    throw new AppError("Banner not found", HttpStatus.NOT_FOUND);
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

  await deleteBannerById(bannerId);
};
