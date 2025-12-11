import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { findUserById } from "../../user/user.repo.js";

export const laodRefferAndEarn = async(req, res) => {
  const user=await findUserById(req.session.user)
  res
    .status(HttpStatus.OK)
    .render("user/referrals", {
      pageTitle: "Refer & Earn",
      user,
      referrals: {},
    });
};
