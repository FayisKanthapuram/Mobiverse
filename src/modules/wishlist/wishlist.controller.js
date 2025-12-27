import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  toggleWishlistService,
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
    } = await loadWishlistService(req?.user?._id, req.query);
    req.session.wishlistCount = totalDocuments;
    res.status(HttpStatus.OK).render("user/wishlist", {
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
    if (!req?.user?._id) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
      });
    }
    const result = await toggleWishlistService(req?.user?._id,req.body);
    req.session.wishlistCount = result.wishlistCount;
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
    const result = await clearWishlistService(req?.user?._id);
    req.session.wishlistCount = 0;
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error on clear to wishlist:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}


