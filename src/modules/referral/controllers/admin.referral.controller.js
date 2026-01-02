import { HttpStatus } from "../../../shared/constants/statusCode.js";

// Admin referral controller - render admin referral views
// Render referrals listing page
export const loadReferrals = (req, res) => {
    res.status(HttpStatus.OK).render("admin/referrals", { pageTitle: "Referrals" });
};