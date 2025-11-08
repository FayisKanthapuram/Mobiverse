import brandModel from "../../models/brandModel.js";
import productModal from "../../models/productModal.js";
import { productValidationSchema } from "../../validators/productValidator.js";
import variantModel from "../../models/variantModel.js";

export const loadProducts = async (req, res) => {
  const brands = await brandModel.find({}, { brandName: 1 }).lean();
  const product = await productModal.find().populate("brandID");
  const variants = await variantModel.find({ productId: product._id });
  console.log(product);
  res.render("admin/products", {
    pageTitle: "Products",
    pageCss: "products",
    pageJs: "products",
    products: [
      {
        name: "oppo",
        images: ["/images/default-product.png"],
        brand: "k30",
        minPrice: "100",
        maxPrice: "300",
        totalStock: 300,
        status: "jk",
      },
    ],
    brands,
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

    //  Group uploaded images by variant index
    req.files.forEach((file) => {
      const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
      if (match) {
        const variantIndex = match[1];
        if (!imagesByVariant[variantIndex]) imagesByVariant[variantIndex] = [];
        imagesByVariant[variantIndex].push(
          `/uploads/products/variants/${file.filename}`
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
    let status = req.body.status;
    status = status ? "list" : "unlist";
    const checkName = await productModal.findOne({ name: productName });
    if (checkName) {
      return res
        .status(400)
        .json({ success: false, message: "Product name already exists" });
    }

    const checkBrand = await brandModel.findById(brand);
    if (!checkBrand) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid brand ID — brand not found in the database",
        });
    }

    let minPrice=Infinity;
    let maxPrice=-Infinity;
    let totalStock=0;
    for(let variant of finalVariants){
      minPrice=Math.min(minPrice,variant.salePrice);
      maxPrice=Math.max(maxPrice,variant.salePrice);
      totalStock+=Number(variant.stockQuantity);
    }

    const product = await productModal.create({
      name: productName,
      brandID: checkBrand._id,
      description,
      isFeatured,
      status,
      minPrice,
      maxPrice,
      totalStock,
    });

    for (let variant of finalVariants) {
      await variantModel.create({
        productId: product._id,
        regularPrice:(variant.regularPrice!=='')? Number(variant.regularPrice):0,
        salePrice: Number(variant.salePrice),
        ram: variant.ram,
        storage: variant.storage,
        colour: variant.colour.toLowerCase(),
        stock: Number(variant.stockQuantity),
        images: variant.images,
      });
    }


    // Proceed to save product in DB
    res.json({ success: true, message: "Product validated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
