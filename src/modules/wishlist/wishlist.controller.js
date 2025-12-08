import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  toggleWishlistService,
  checkWishlistService,
  loadWishlistService,
  clearWishlistService,
} from "./wishlist.service.js";

export const loadWishlist = async (req, res, next) => {
  try {
    const {
      wishlist,
      user,
      totalPages,
      currentPage,
      limit,
      totalDocuments,
    } = await loadWishlistService(req.session.user, req.query);
    res.render("user/wishlist", {
      pageTitle: "My Wishlist",
      pageJs: "wishlist",
      wishlist: wishlist[0],
      user,
      totalPages,
      currentPage,
      limit,
      totalDocuments,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
      });
    }
    const result = await toggleWishlistService(req.session.user,req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error on toogle wishlist:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const clearWishlist=async(req,res)=>{
  try {
    const result = await clearWishlistService(req.session.user);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error on clear to wishlist:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

export const checkWishlist = async (req, res) => {
  try {
    const result = await checkWishlistService(req.session.user, req.params);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error on check wishlist:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};


