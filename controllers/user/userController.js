import brandModel from "../../models/brandModel.js";
import productModel from "../../models/productModel.js";
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
          isFeatured:true
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

    const brands=await brandModel.find({isListed:true}).limit(6)


    // Render the index page and pass the data
    res.render("user/home", {
      heroData,
      latestProducts,
      featuredProducts,
      pageTitle: "Home",
      pageCss: "home",
      pageJs: "home",
      brands
      // You can also pass bestSellers, reviews, etc.
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};
