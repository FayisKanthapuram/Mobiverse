import brandModel from "../../models/brandModel.js";
import productModal from "../../models/productModal.js";
import { productValidationSchema } from "../../validators/productValidator.js";
import variantModel from "../../models/variantModel.js";

export const loadProducts = async (req, res) => {
  const brands = await brandModel
    .find({ isListed: true }, { brandName: 1 })
    .lean();
  const products = await productModal.find().populate("brandID");
  console.log(products);
  res.render("admin/products", {
    pageTitle: "Products",
    pageCss: "products",
    pageJs: "products",
    products,
    brands,
    currentPage: 2,
    limit: 5,
    totalDocuments: 20,
    totalPages: 5,
  });
};

export const addProduct = async (req, res) => {
  try {
    // Validate text fields
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const variants = JSON.parse(req.body.variants);
    const imagesByVariant = {};

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images uploaded" });
    }

    //  Group uploaded images by variant index
    req.files.forEach((file) => {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (match) {
        const variantIndex = match[1];
        if (!imagesByVariant[variantIndex]) imagesByVariant[variantIndex] = [];
        imagesByVariant[variantIndex].push(
          `/uploads/products/${file.filename}`
        );
      }
    });

    // Validate minimum 3 images per variant
    for (let i = 0; i < variants.length; i++) {
      const imageCount = imagesByVariant[i]?.length || 0;
      if (imageCount < 3) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1} must have at least 3 images.`,
        });
      }
    }

    const finalVariants = variants.map((variant, index) => ({
      ...variant,
      images: imagesByVariant[index] || [],
    }));
    console.log(finalVariants);

    const { productName, brand, description, isFeatured } = req.body;
    let isListed = req.body.isListed;
    console.log(isListed);
    const checkName = await productModal.findOne({ name: productName });
    if (checkName) {
      return res
        .status(400)
        .json({ success: false, message: "Product name already exists" });
    }

    const checkBrand = await brandModel.findById(brand);
    if (!checkBrand) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID — brand not found in the database",
      });
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalStock = 0;
    for (let variant of finalVariants) {
      minPrice = Math.min(minPrice, variant.salePrice);
      maxPrice = Math.max(maxPrice, variant.salePrice);
      totalStock += Number(variant.stockQuantity);
    }

    const product = await productModal.create({
      name: productName,
      image: imagesByVariant["0"][0],
      brandID: checkBrand._id,
      description,
      isFeatured,
      isListed,
      minPrice,
      maxPrice,
      totalStock,
    });

    await Promise.all(
      finalVariants.map((variant) =>
        variantModel.create({
          productId: product._id,
          regularPrice: variant.regularPrice ? Number(variant.regularPrice) : 0,
          salePrice: Number(variant.salePrice),
          ram: variant.ram,
          storage: variant.storage,
          colour: variant.colour.toLowerCase(),
          stock: Number(variant.stockQuantity),
          images: variant.images,
        })
      )
    );

    // Proceed to save product in DB
    res.json({ success: true, message: "Product validated successfully" });
  } catch (err) {
    console.error("Error adding product", err.message);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const listProduct = async (req, res) => {
  const { productId } = req.params;
  const product = await productModal.findById(productId);
  if (!product)
    res.status(404).json({ success: false, message: "product is not found" });
  product.isListed = !product.isListed;
  await product.save();
  res.status(200).json({ success: true });
};
