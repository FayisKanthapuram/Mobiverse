import brandModel from "../../models/brandModel.js";
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";
import variantModel from "../../models/variantModel.js";
import Joi from "joi";


export const loadHome = async (req, res) => {
  try {
    // --- This is placeholder data ---
    // You would fetch this from your database
    const heroData = {
      title: "SAMSUNG GALAXY S23 ULTRA 5G",
      subtitle:
        "The Future in Your Hand. Order now and get exclusive launch offers.",
      link: "/shop/s23-ultra",
      image: "/images/s23-ultra-hero.png",
    };

    const latestProducts = await productModel.aggregate([
      {
        $lookup: {
          from: "brands",
          foreignField: "_id",
          localField: "brandID",
          as: "brands",
        },
      },
      {
        $unwind: "$brands",
      },
      {
        $match: {
          "brands.isListed": true,
          isListed: true,
        },
      },
      {
        $lookup: {
          from: "variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$isListed", true] },
                  ],
                },
              },
            },
            {
              $sort: { salePrice: 1 },
            },
            {
              $limit: 1,
            },
          ],
          as: "variants",
        },
      },
      {
        $unwind: "$variants",
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    const featuredProducts = await productModel.aggregate([
      {
        $lookup: {
          from: "brands",
          foreignField: "_id",
          localField: "brandID",
          as: "brands",
        },
      },
      {
        $unwind: "$brands",
      },
      {
        $match: {
          "brands.isListed": true,
          isListed: true,
          isFeatured: true,
        },
      },
      {
        $lookup: {
          from: "variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$isListed", true] },
                  ],
                },
              },
            },
            {
              $sort: { salePrice: 1 },
            },
            {
              $limit: 1,
            },
          ],
          as: "variants",
        },
      },
      {
        $unwind: "$variants",
      },
    ]);

    const brands = await brandModel.find({ isListed: true }).limit(6);

    // Render the index page and pass the data
    res.render("user/home", {
      heroData,
      latestProducts,
      featuredProducts,
      pageTitle: "Home",
      pageCss: "home",
      pageJs: "home",
      brands,
      // You can also pass bestSellers, reviews, etc.
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};

export const loadShop = async (req, res) => {
  try {
    const search = req.query.search || "";
    const brand = req.query.brand || "all";
    const sort = req.query.sort || "";
    const minPrice = req.query.min;
    const maxPrice = req.query.max;
    const currentPage = parseInt(req.query.page) || 1;

    const limit = 3;
    const skip = (currentPage - 1) * limit;

    const matchStage = {
      "brands.isListed": true,
      isListed: true,
    };
    if (brand && brand !== "all") {
      matchStage["brands.brandName"] = brand;
    }
    if (search) {
      matchStage["name"] = { $regex: search.trim(), $options: "i" };
    }
    const sortStage = {};
    if (sort === "price-asc") {
      sortStage["variants.salePrice"] = 1;
    } else if (sort === "price-desc") {
      sortStage["variants.salePrice"] = -1;
    } else if (sort === "a-z") {
      sortStage["name"] = 1;
    } else if (sort === "z-a") {
      sortStage["name"] = -1;
    } else if (sort === "latest") {
      sortStage["updatedAt"] = -1;
    }

    const priceStage = {};
    if (minPrice) {
      priceStage["$gte"] = Number(minPrice);
    }

    if (maxPrice) {
      priceStage["$lte"] = Number(maxPrice);
    }
    const pipeline = [
      {
        $lookup: {
          from: "brands",
          foreignField: "_id",
          localField: "brandID",
          as: "brands",
        },
      },
      {
        $unwind: "$brands",
      },
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$isListed", true] },
                  ],
                },
              },
            },
            {
              $sort: { salePrice: 1 },
            },
            {
              $limit: 1,
            },
          ],
          as: "variants",
        },
      },
      {
        $unwind: "$variants",
      },
    ];
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }
    if (Object.keys(priceStage).length > 0) {
      pipeline.push({ $match: { "variants.salePrice": priceStage } });
    }

    let pipeline1 = structuredClone(pipeline);
    pipeline1.push({ $count: "totalDocuments" });
    const countElements = await productModel.aggregate(pipeline1);
    const totalDocuments =
      countElements.length > 0 ? countElements[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);
    pipeline.push({ $skip: skip }, { $limit: limit });
    const products = await productModel.aggregate(pipeline);

    const brands = await brandModel.find({ isListed: true });
    res.render("user/shop", {
      query: req.query,
      products,
      brands: brands,
      pageTitle: "Shop",
      breadcrumbs: [
        { name: "Home", link: "/home" },
        { name: "Shop", link: "/shop" },
        {
          name: brand
            ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
            : "All Brands",
        },
      ],
      pagination: {
        currentPage,
        totalPages,
        hasPrevPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
      pageJs: "shop",
    });
  } catch (error) {
    console.log(error);
  }
};


export const loadPersonalInfo = async (req, res) => {
  try {
    const user=await userModel.findById(req.session.user);
    res.render('user/personalInfo',{pageTitle:'Personal Information',user});
  } catch (error) {
    console.error("Error Personal Info:", error);
    res.status(500).render("error", {
      message: "Unable to load personal info",
      pageTitle: "Error - Mobiverse",
    });
  }
};

export const loadEditInfo = async (req,res)=>{
  try {
    const user=await userModel.findById(req.session.user);
    res.render('user/editInfo',{pageTitle:'Personal Information',user,pageJs:'editInfo'});
  } catch (error) {
    console.error("Error fetching edit info", error);
    res.status(500).render("error", {
      message: "Unable to load edit info",
      pageTitle: "Error - Mobiverse",
    });
  }
}

const usernameValidator = Joi.object({
  username: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must have at least 2 characters",
    "string.max": "Username cannot exceed 50 characters",
  }),
  removePhoto:Joi.boolean().optional(),
});

export const editInfo=async (req,res)=>{
  try {
    const {error}=usernameValidator.validate(req.body);
    if(error){
      if (req.file) {
        const fs = await import("fs");
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {username}=req.body;
    const removePhoto=req.body.removePhoto?req.body.removePhoto:false;
    const avatar=req.file?`/uploads/user/${req.file.filename}`:null;

    const user=await userModel.findById(req.session.user);

    if(removePhoto&&!avatar){
      user.avatar='/images/user-avatar.svg';
    }else if(avatar){
      user.avatar=avatar;
    }

    user.username=username;
    await user.save();

    return res.status(200).json({success:true,message:'Your personal details have been updated!'});
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export const loadEditEmail = async (req,res)=>{
  try {
    const user=await userModel.findById(req.session.user);
    res.render('user/editEmail',{pageTitle:'Personal Information',user});
  } catch (error) {
    console.error("Error fetching edit Email", error);
    res.status(500).render("error", {
      message: "Unable to load edit Email",
      pageTitle: "Error - Mobiverse",
    });
  }
}

export const loadChangePassword=async(req,res)=>{
  try {
    const user=await userModel.findById(req.session.user);
    res.render('user/changePasswod',{pageTitle:'Change Password',user});
  } catch (error) {
    console.error("Error fetching edit Email", error);
    res.status(500).render("error", {
      message: "Unable to load edit Email",
      pageTitle: "Error - Mobiverse",
    });
  }
}

export const loadProductDetails = async (req, res) => {
  try {
    const { variantId } = req.params;
    const color = req.query.color;
    let selectedVariant;
    if (color) {
      selectedVariant = await variantModel.findOne({ colour: color }).lean();
    } else {
      selectedVariant = await variantModel.findById(variantId).lean();
    }

    const productData = await productModel.aggregate([
      {
        $match: { _id: selectedVariant.productId, isListed: true },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandID",
          foreignField: "_id",
          as: "brands",
        },
      },
      { $unwind: "$brands" },
      { $match: { "brands.isListed": true } },
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
    ]);

    if (!productData.length) {
      return res.status(404).send("Product not found");
    }

    const product = productData[0];

    const colorGroups = {};
    product.variants.forEach((v) => {
      if (!colorGroups[v.colour]) colorGroups[v.colour] = [];
      colorGroups[v.colour].push(v);
    });

    for (const color in colorGroups) {
      colorGroups[color].sort((a, b) => a.salePrice - b.salePrice);
    }

    const relatedProducts = await productModel.aggregate([
      {
        $match: { _id: { $ne: productData[0]._id } },
      },
      {
        $lookup: {
          from: "brands",
          foreignField: "_id",
          localField: "brandID",
          as: "brands",
        },
      },
      {
        $unwind: "$brands",
      },
      {
        $match: {
          "brands.isListed": true,
          isListed: true,
        },
      },
      {
        $lookup: {
          from: "variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$isListed", true] },
                  ],
                },
              },
            },
            {
              $sort: { salePrice: 1 },
            },
            {
              $limit: 1,
            },
          ],
          as: "variants",
        },
      },
      {
        $unwind: "$variants",
      },
      {
        $limit: 4,
      },
    ]);

    // Dummy reviews for testing
    const reviews = [
      {
        userName: "Rahul Mehta",
        rating: 5,
        comment:
          "Amazing phone! The battery easily lasts me two days and the camera quality is top-notch.",
        date: new Date("2025-10-15"),
      },
      {
        userName: "Sneha Sharma",
        rating: 4,
        comment:
          "Very sleek and smooth performance. Only issue is a bit of heating while gaming.",
        date: new Date("2025-09-30"),
      },
      {
        userName: "Amit Verma",
        rating: 3,
        comment:
          "Good for casual use, but expected slightly better display brightness for the price.",
        date: new Date("2025-08-22"),
      },
      {
        userName: "Priya Nair",
        rating: 5,
        comment:
          "Absolutely love this device! The color and design are just perfect.",
        date: new Date("2025-11-01"),
      },
      {
        userName: "Karan Patel",
        rating: 4,
        comment:
          "Fast delivery and well-packed. Phone works perfectly fine so far.",
        date: new Date("2025-11-05"),
      },
    ];

    res.render("user/productDetails", {
      product,
      selectedVariant,
      colorGroups,
      pageTitle: product.name,
      relatedProducts,
      reviews,
      breadcrumbs: [
        { name: "Home", link: "/home" },
        { name: "Shop", link: "/shop" },
        {
          name: product.brands.brandName
            ? product.brands.brandName.charAt(0).toUpperCase() + product.brands.brandName.slice(1).toLowerCase()
            : "All Brands",
          link:`/shop?brand=${product.brands.brandName}`,
        },
        {name:product.name},
      ],
    });
  } catch (error) {
    console.log(error);
  }
};
