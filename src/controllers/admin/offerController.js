// controllers/offerController.js

import offerModal from "../../models/offerModal.js";
import {
  addOfferService,
  deleteOfferStatusService,
  editOfferService,
  getOfferByIdService,
  getOfferPageDataService,
  toggleOfferStatusService,
} from "../../services/offerServices.js";
import { offerSchema } from "../../validators/offerValidator.js";

export const loadOffers = async (req, res, next) => {
  try {
    const offerType = req.query.type || "product";
    const searchQuery = req.query.search || "";
    const statusFilter = req.query.status || "";
    const sortFilter = req.query.sort || "";
    const currentPage = parseInt(req.query.page) || 1;
    const data = await getOfferPageDataService(
      offerType,
      searchQuery,
      statusFilter,
      sortFilter,
      currentPage
    );

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

export const addOffer = async (req, res) => {
  try {
    const { error } = offerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    await addOfferService(req.body);
    return res
      .status(200)
      .json({ success: true, message: "Offer added successfully" });
  } catch (error) {
    console.error("Add Offer Error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getOfferById=async(req,res,next)=>{
  try {
    const {id}=req.params;
    const offer=await getOfferByIdService(id);
    return res.status(200).json({success:true,offer})
  } catch (error) {
    next(error)
  }
}

export const editOffer=async(req,res)=>{
  try {
    const { error } = offerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {id}=req.params
    await editOfferService(id,req.body);
    return res
      .status(200)
      .json({ success: true, message: "Edit added successfully" });
  } catch (error) {
    console.error("Edit offer error Offer Error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export const toggleOfferStatus=async(req,res)=>{
  try {
    const {id}=req.params;
    await toggleOfferStatusService(id);
    return res
      .status(200)
      .json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("Toggle offer error Offer Error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export const deleteOffer=async(req,res)=>{
  try {
    const {id}=req.params;
    await deleteOfferStatusService(id);
    return res
      .status(200)
      .json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete offer error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}