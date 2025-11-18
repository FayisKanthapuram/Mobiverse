import userModel from "../../models/userModel.js";

export const loadCustomers = async (req, res) => {
  const currentPage=parseInt(req.query.page)||1;

  const totalCustomersCound = await userModel.countDocuments().lean();
  const blockedCustomerCount = await userModel
    .countDocuments({ isBlocked: true })
    .lean();

  const limit=3;
  const skip=(currentPage-1)*limit;
  const totalPages=Math.ceil(totalCustomersCound/limit);

  const customers = await userModel.find().skip(skip).limit(limit).lean();

  res.render("admin/customers", {
    pageTitle: "Customers",
    pageCss: "customers",
    pageJs: "customers",
    customers,
    totalCustomersCound,
    blockedCustomerCount,
    currentPage,
    limit,
    totalDocuments:totalCustomersCound,
    totalPages,
  });
};

export const blockCustomer = async (req, res) => {
  const { id } = req.params;
  const user = await userModel.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: "user not found" });
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.status(200).json({ success: true });
};
