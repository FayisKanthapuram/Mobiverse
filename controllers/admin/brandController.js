import brandModel from "../../models/brandModel.js";
import Joi from "joi";

export const loadBrands = async (req, res) => {
  const searchQuery = req.query.search || "";
  const filter = req.query.filter || "All";
  const currentPage = parseInt(req.query.page) || 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  let query = {};

  if (searchQuery) {
    query.brandName = { $regex: searchQuery.trim(), $options: "i" };
  }

  if (filter === "listed") {
    query.isListed = true;
  } else if (filter === "unlisted") {
    query.isListed = false;
  }
  const totalDocuments = await brandModel.find(query).countDocuments();
  let totalPages = Math.ceil(totalDocuments / limit);
  const brands = await brandModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.render("admin/brands", {
    pageTitle: "Brands",
    pageCss: "brands",
    pageJs: "brands",
    brands,
    filter,
    currentPage,
    limit,
    totalDocuments,
    searchQuery,
    totalPages,
  });
};

const brandValidation = Joi.object({
  brandId: Joi.string().optional().allow(null, ""),
  brandName: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Brand name is required",
    "string.min": "Brand name must have at least 2 characters",
    "string.max": "Brand name cannot exceed 50 characters",
  }),
});

export const addBrand = async (req, res) => {
  try {
    const { error } = brandValidation.validate(req.body);
    if (error) {
      // Remove uploaded file if validation fails
      if (req.file) {
        const fs = await import("fs");
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Save data in MongoDB
    const { brandName } = req.body;
    const logoPath = req.file ? `/uploads/brands/${req.file.filename}` : null;

    const existingBrand = await brandModel.findOne({ brandName });
    if (existingBrand) {
      if (req.file) {
        const fs = await import("fs");
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ success: false, message: "Brand name already exists" });
    }

    const newBrand = new brandModel({ brandName, logo: logoPath });
    await newBrand.save();

    res.json({
      success: true,
      message: " Brand added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const editBrand = async (req, res) => {
  const { error } = brandValidation.validate(req.body);
  if (error) {
    // Remove uploaded file if validation fails
    if (req.file) {
      const fs = await import("fs");
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { brandName, brandId } = req.body;
  const brand = await brandModel.findOne({ _id: brandId });
  const logoPath = req.file ? `/uploads/brands/${req.file.filename}` : brand.logo;

  console.log(brand.brandName,brandName)
  if (brand.brandName !== brandName) {
    const existingBrand = await brandModel.findOne({ brandName });
    console.log(existingBrand)
    if (existingBrand) {
      if (req.file) {
        const fs = await import("fs");
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ success: false, message: "Brand name already exists" });
    }
  }
  console.log(logoPath)
  brand.brandName = brandName;
  brand.logo = logoPath;

  await brand.save();
  res.status(200).json({success:true,message:"Brand updated successfully!"})
};

export const listBrand = async (req, res) => {
  console.log("hello");
  const { userId } = req.params;
  const brand = await brandModel.findOne({ _id: userId });
  if (!brand) res.status(400).json({ success: "false" });
  brand.isListed = !brand.isListed;
  await brand.save();
  res.status(200).json({ success: true });
};
