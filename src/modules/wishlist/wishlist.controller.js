import { HttpStatus } from "../../shared/constants/statusCode.js";
import { WishlistMessages } from "../../shared/constants/messages/wishlistMessages.js";
import {
  toggleWishlistService,
  loadWishlistService,
  clearWishlistService,
} from "./wishlist.service.js";
import { AppError } from "../../shared/utils/app.error.js";

// Wishlist controller - user wishlist pages and actions
// Load wishlist page
export const loadWishlist = async (req, res) => {
  const { wishlist, user, totalPages, currentPage, limit, totalDocuments } =
    await loadWishlistService(req.user._id, req.query);

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
};

// Toggle wishlist item (add/remove)
export const toggleWishlist = async (req, res) => {
  if (!req.user?._id) {
    throw new AppError(WishlistMessages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const result = await toggleWishlistService(req.user._id, req.body);

  req.session.wishlistCount = result.wishlistCount;

  res.status(result.status).json(result);
};

// Clear entire wishlist
export const clearWishlist = async (req, res) => {
  const result = await clearWishlistService(req.user._id);

  req.session.wishlistCount = 0;

  res.status(result.status).json(result);
};
