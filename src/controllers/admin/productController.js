import brandModel from "../../models/brandModel.js";
import productModel from "../../models/productModel.js";
import { productValidationSchema } from "../../validators/productValidator.js";
import variantModel from "../../models/variantModel.js";
import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.js";
import {
  getFilteredProducts,
  getProductsBySearch,
} from "../../services/product.service.js";
import { cloudinaryUpload } from "../../middlewares/upload.js";

export const loadProducts = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "All";
    const brand = req.query.brand || "";
    const currentPage = parseInt(req.query.page) || 1;

    const result = await getFilteredProducts({
      search,
      status,
      brand,
      page: currentPage,
    });

    res.render("admin/products", {
      pageTitle: "Products",
      pageCss: "products",
      pageJs: "products",

      products: result.products,
      brands: result.brands,
      totalDocuments: result.totalDocuments,
      limit: result.limit,
      totalPages: result.totalPages,

      currentPage,
      query: req.query,
    });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res) => {
  const uploadedImages = []; // 🔥 store public_ids to delete if needed

  try {
    // Validate text fields
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      await rollbackCloudinary(uploadedImages);
      return res.status(400).json({ success: false, message: error.message });
    }

    // Parse variants JSON
    const variants = JSON.parse(req.body.variants);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images uploaded" });
    }

    const imagesByVariant = {};

    // Upload images to Cloudinary
    for (const file of req.files) {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (match) {
        const variantIndex = match[1];

        // Upload
        const uploadResult = await cloudinaryUpload(file.buffer, "products");

        // Save uploaded image public_id for rollback
        uploadedImages.push(uploadResult.public_id);

        if (!imagesByVariant[variantIndex]) imagesByVariant[variantIndex] = [];
        imagesByVariant[variantIndex].push(uploadResult.secure_url);
      }
    }

    // Validate minimum 3 images per variant
    for (let i = 0; i < variants.length; i++) {
      if (!imagesByVariant[i] || imagesByVariant[i].length < 3) {
        await rollbackCloudinary(uploadedImages);
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1} must have at least 3 images`,
        });
      }
    }

    // Attach Cloudinary images
    const finalVariants = variants.map((variant, index) => ({
      ...variant,
      images: imagesByVariant[index] || [],
    }));

    // Product name validation
    const existingProduct = await productModel.findOne({
      name: req.body.productName,
    });

    if (existingProduct) {
      // ❗ DELETE cloud images because validation FAILED
      await rollbackCloudinary(uploadedImages);

      return res.status(400).json({
        success: false,
        message: "Product name already exists",
      });
    }

    // Validate brand ID
    const brand = await brandModel.findById(req.body.brand);
    if (!brand) {
      await rollbackCloudinary(uploadedImages);
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    // Calculate min/max and stock
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalStock = 0;

    for (const v of finalVariants) {
      minPrice = Math.min(minPrice, v.salePrice);
      maxPrice = Math.max(maxPrice, v.salePrice);
      totalStock += Number(v.stockQuantity);
    }

    // Save product
    const product = await productModel.create({
      name: req.body.productName,
      image: imagesByVariant["0"][0],
      brandID: brand._id,
      description: req.body.description,
      isFeatured: req.body.isFeatured,
      isListed: req.body.isListed,
      minPrice,
      maxPrice,
      totalStock,
    });

    // Save variants
    await Promise.all(
      finalVariants.map((variant) =>
        variantModel.create({
          productId: product._id,
          regularPrice: variant.regularPrice || 0,
          salePrice: Number(variant.salePrice),
          ram: variant.ram,
          storage: variant.storage,
          colour: variant.colour.toLowerCase(),
          stock: Number(variant.stockQuantity),
          images: variant.images,
          isListed: variant.isListed,
        })
      )
    );

    res.json({ success: true, message: "Product added successfully" });
  } catch (err) {
    console.error("Add Product Error:", err.message);

    await rollbackCloudinary(uploadedImages);

    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// 🔥 DELETE all uploaded images if something fails
async function rollbackCloudinary(images) {
  for (const id of images) {
    try {
      await cloudinary.uploader.destroy(id);
    } catch (err) {
      console.log("Failed to delete:", id);
    }
  }
}

export const toggleProduct = async (req, res) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId);
  if (!product)
    res.status(404).json({ success: false, message: "product is not found" });
  product.isListed = !product.isListed;
  await product.save();
  res.status(200).json({ success: true });
};

export const getProducts = async (req, res) => {
  const search = req.query.q || "";
  const products = await getProductsBySearch(search);
  res.json({ success: true, products });
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const products = await productModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $lookup: {
          from: "variants",
          foreignField: "productId",
          localField: "_id",
          as: "variants",
        },
      },
    ]);
    res.status(200).json({ success: true, products: products[0] });
  } catch (error) {
    console.log(error);
    res.status(404).json({ success: false });
  }
};

export const editProduct = async (req, res) => {
  const uploadedImages = []; // track newly added Cloudinary uploads

  try {
    const { productId } = req.params;

    // Validate body
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const variants = JSON.parse(req.body.variants);

    // Fetch existing variants from DB
    const dbVariants = await variantModel.find({ productId });

    const newImagesMapping = {}; // new Cloudinary uploads

    // Upload new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
        if (match) {
          const variantIndex = match[1];

          const uploadResult = await cloudinaryUpload(file.buffer, "products");
          uploadedImages.push(uploadResult.public_id);

          if (!newImagesMapping[variantIndex])
            newImagesMapping[variantIndex] = [];

          newImagesMapping[variantIndex].push(uploadResult.secure_url);
        }
      }
    }

    // Merge new images into variants
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].existingImages) variants[i].existingImages = [];

      if (newImagesMapping[i]) {
        variants[i].existingImages.push(...newImagesMapping[i]);
      }
    }

    // DELETE IMAGES REMOVED BY USER
    for (let i = 0; i < variants.length; i++) {
      const oldVariant = dbVariants[i];
      if (!oldVariant) continue;

      const oldImages = oldVariant.images; // from DB
      const newImages = variants[i].existingImages; // after edit

      const removedImages = oldImages.filter((img) => !newImages.includes(img));

      for (const url of removedImages) {
        const publicId = getPublicIdFromUrl(url);
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log("Deleted old:", publicId);
        } catch (e) {
          console.log("Failed to delete:", publicId);
        }
      }
    }

    // Validate minimum 3 images
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].existingImages.length < 3) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1} must have at least 3 images.`,
        });
      }
    }

    // Update product record
    let mainImage = variants.find((v) => v.existingImages.length > 0)
      ?.existingImages[0];

    await productModel.findByIdAndUpdate(productId, {
      name: req.body.productName,
      brandID: req.body.brand,
      description: req.body.description,
      isFeatured: req.body.isFeatured,
      isListed: req.body.isListed,
      image: mainImage,
    });

    // Update or create variants in DB
    await Promise.all(
      variants.map(async (variant, index) => {
        if (!variant._id) {
          return variantModel.create({
            productId,
            images: variant.existingImages,
            regularPrice: variant.regularPrice,
            salePrice: variant.salePrice,
            ram: variant.ram,
            storage: variant.storage,
            colour: variant.colour.toLowerCase(),
            stock: variant.stockQuantity,
            isListed: variant.isListed,
          });
        } else {
          return variantModel.findByIdAndUpdate(variant._id, {
            images: variant.existingImages,
            regularPrice: variant.regularPrice,
            salePrice: variant.salePrice,
            ram: variant.ram,
            storage: variant.storage,
            colour: variant.colour.toLowerCase(),
            stock: variant.stockQuantity,
            isListed: variant.isListed,
          });
        }
      })
    );

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.log("Edit Product Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

function getPublicIdFromUrl(url) {
  const parts = url.split("/");
  const filename = parts.pop(); // e.g. vvl40tvnqs1qioshgxzf.png
  const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
  return folder.replace(/^v\d+\//, "") + "/" + filename.split(".")[0];
}
