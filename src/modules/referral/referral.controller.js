import { HttpStatus } from "../../shared/constants/statusCode.js";

export const loadReferrals = (req, res) => {
    res.status(HttpStatus.OK).render("admin/referrals", { pageTitle: "Referrals" });
};