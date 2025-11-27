import brandModel from "../../models/brandModel.js";
import productModel from "../../models/productModel.js";
import { productValidationSchema } from "../../validators/productValidator.js";
import variantModel from "../../models/variantModel.js";
import mongoose from "mongoose";
import { getFilteredProducts, getProductsBySearch } from "../../services/productService.js";

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

    const { productName, brand, description, isFeatured } = req.body;
    let isListed = req.body.isListed;
    const checkName = await productModel.findOne({ name: productName });
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

    const product = await productModel.create({
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
          isListed:variant.isListed,
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

export const toggleProduct = async (req, res) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId);
  if (!product)
    res.status(404).json({ success: false, message: "product is not found" });
  product.isListed = !product.isListed;
  await product.save();
  res.status(200).json({ success: true });
};

export const getProducts=async (req,res)=>{
  const search=req.query.q||'';
  const products=await getProductsBySearch(search);
  res.json({success:true,products});
}

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
  try {
    const { productId } = req.params;
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const variants = JSON.parse(req.body.variants);
    // console.log(variants);

    const imagesByVariant = {};

    // console.log(req.files);
    if (req.files.length !== 0) {
      const imageFieldName = {};
      req.files.forEach((file) => {
        const match = file.fieldname.match(/variantImages_(\d+)_\d+/);
        if (match) {
          // console.log(match);
          const variantIndex = match[1];
          if (!imagesByVariant[variantIndex])
            imagesByVariant[variantIndex] = [];
          if (!imageFieldName[variantIndex]) imageFieldName[variantIndex] = [];
          imagesByVariant[variantIndex].push(
            `/uploads/products/${file.filename}`
          );
          imageFieldName[variantIndex].push(file.fieldname);
        }
      });
      for (let index in imageFieldName) {
        const isThreeImage = imageFieldName[index]
          .map((x) => Number(x.split("_")[2]))
          .some((x) => x >= 2);
        if (!isThreeImage) {
          return res.status(400).json({
            success: false,
            message: `Variant ${
              Number(index) + 1
            } must have at least 3 images.`,
          });
        }
      }
    } else {
      for (let i = 0; i < variants.length; i++) {
        if (variants[i].existingImages.length < 3) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1} must have at least 3 images.`,
          });
        }
      }
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalStock = 0;
    for (let variant of variants) {
      minPrice = Math.min(minPrice, variant.salePrice);
      maxPrice = Math.max(maxPrice, variant.salePrice);
      totalStock += Number(variant.stockQuantity);
    }

    for (let index in imagesByVariant) {
      variants[Number(index)].existingImages.push(...imagesByVariant[index]);
    }

    let updatedMainImagePath = null;
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].existingImages?.length > 0) {
        updatedMainImagePath = variants[i].existingImages[0];
        break;
      } else if (imagesByVariant[i]?.length > 0) {
        updatedMainImagePath = imagesByVariant[i.toString()][0];
        break;
      }
    }

    const name = req.body.productName;
    const product = await productModel.findOne({ _id: productId });
    if (product.name !== name) {
      const existingProduct = await productModel.findOne({ name });
      if (existingProduct) {
        return res
          .status(400)
          .json({ success: false, message: "Product name already exists" });
      }
    }

    await productModel.findByIdAndUpdate(
      productId,
      {
        name,
        brandID: req.body.brand,
        description: req.body.description,
        isFeatured: req.body.isFeatured,
        isListed: req.body.isListed,
        minPrice,
        maxPrice,
        totalStock,
        image: updatedMainImagePath,
      },
      { new: true, runValidators: true }
    );

    await Promise.all(
      variants.map((variant) => {
        if (variant._id === null) {
          return variantModel.create({
            productId: product._id,
            regularPrice: variant.regularPrice
              ? Number(variant.regularPrice)
              : 0,
            salePrice: Number(variant.salePrice),
            ram: variant.ram,
            storage: variant.storage,
            colour: variant.colour.toLowerCase(),
            stock: Number(variant.stockQuantity),
            images: variant.existingImages,
            isListed:variant.isListed,
          });
        } else {
          return variantModel.findByIdAndUpdate(
            variant._id,
            {
              regularPrice: variant.regularPrice
                ? Number(variant.regularPrice)
                : 0,
              salePrice: Number(variant.salePrice),
              ram: variant.ram,
              storage: variant.storage,
              colour: variant.colour.toLowerCase(),
              stock: Number(variant.stockQuantity),
              images: variant.existingImages,
              isListed:variant.isListed,
            },
            { new: true }
          );
        }
      })
    );

    res
      .status(200)
      .json({ message: "product edited successfully", success: true });
  } catch (error) {
    console.log(error);
  }
};
