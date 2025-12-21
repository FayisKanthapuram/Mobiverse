import { HttpStatus } from "../../shared/constants/statusCode.js";
import { cloudinaryUpload } from "../../shared/middlewares/upload.js";
import { AppError } from "../../shared/utils/app.error.js";
import { rollbackCloudinary } from "../product/helpers/admin.product.helper.js";
import { createBanner, findBannerById, findBanners } from "./banners.repo.js";

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
