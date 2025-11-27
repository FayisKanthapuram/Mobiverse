// controllers/offerController.js

import { getOfferPageData } from "../../services/offerServices.js";

export const loadOffers = async (req, res, next) => {
  try {
    const offerType=req.query.type||'product';
    const searchQuery=req.query.search||'';
    const statusFilter=req.query.status||'';
    const sortFilter=req.query.sort||'';
    const currentPage=parseInt(req.query.page)||1;
    const data = await getOfferPageData(offerType,searchQuery,statusFilter,sortFilter,currentPage);

    res.render("admin/offers", {
      pageTitle: "Offers",
      pageCss: "offers",
      pageJs: "offers",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};
