import { cloudinaryUpload } from "../../middlewares/upload.js";
import cloudinary from "../../config/cloudinary.js";
import brandModel from "../../models/brandModel.js";
import Joi from "joi";

export const loadBrands = async (req, res) => {
  const search = req.query.search || "";
  const filter = req.query.filter || "All";
  const currentPage = parseInt(req.query.page) || 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  let query = {};

  if (search) {
    query.brandName = { $regex: search, $options: "i" };
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
    .sort({ brandName:1})
    .skip(skip)
    .limit(limit);

  res.render("admin/brands", {
    pageTitle: "Brands",
    pageCss: "brands",
    pageJs: "brands",
    brands,
    currentPage,
    limit,
    totalDocuments,
    totalPages,
    query: req.query,
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
    // Validate Inputs
    const { error } = brandValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { brandName } = req.body;

    // Check for existing brand
    const existingBrand = await brandModel.findOne({ brandName });
    if (existingBrand) {
      return res
        .status(400)
        .json({ success: false, message: "Brand name already exists" });
    }

    // Upload brand logo to Cloudinary
    let cloudinaryLogo = null;
    if (req.file) {
      const uploadResult = await cloudinaryUpload(
        req.file.buffer,
        "brands"
      );
      cloudinaryLogo = uploadResult.secure_url;
    }

    // Save to MongoDB
    const newBrand = new brandModel({
      brandName,
      logo: cloudinaryLogo,
    });

    await newBrand.save();

    res.json({
      success: true,
      message: "Brand added successfully",
      brand: newBrand,
    });

  } catch (error) {
    console.error("Add Brand Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const editBrand = async (req, res) => {
  try {
    // Validate body
    const { error } = brandValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { brandName, brandId } = req.body;

    // Find brand
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    // Check if brand name was changed
    if (brand.brandName !== brandName) {
      const existingBrand = await brandModel.findOne({ brandName });
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Brand name already exists",
        });
      }
    }

    let newLogoUrl = brand.logo; // default is old logo

    // If new image uploaded → replace on Cloudinary
    if (req.file) {
      // 1️⃣ Upload the new logo
      const uploadResult = await cloudinaryUpload(req.file.buffer, "brands");

      newLogoUrl = uploadResult.secure_url;

      // 2️⃣ Delete old logo from Cloudinary (if exists)
      if (brand.logo) {
        // Extract Cloudinary public_id from brand.logo URL
        const publicId = brand.logo
          .split("/")
          .pop()
          .split(".")[0]; // 'abc123' from URL

        await cloudinary.uploader.destroy(`ecommerce/brands/${publicId}`);
      }
    }

    // Update DB
    brand.brandName = brandName;
    brand.logo = newLogoUrl;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully!",
      brand,
    });
  } catch (error) {
    console.error("Edit Brand Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const listBrand = async (req, res) => {
  const { brandId } = req.params;
  const brand = await brandModel.findOne({ _id: brandId });
  if (!brand)
    res.status(400).json({ success: "false", message: "brand is not found" });
  brand.isListed = !brand.isListed;
  await brand.save();
  res.status(200).json({ success: true});
};

export const getBrandById = async (req, res) => {
  try {
    const brand = await brandModel.findById(req.params.id).lean();
    if (!brand) return res.status(404).json({ message: "brand not found" });
    res.json({ brand });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
