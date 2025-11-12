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

export const loadBrands = async (req, res) => {
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
    if(search){
      matchStage["name"]={ $regex: search.trim(), $options: "i" };
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
    const [{ totalDocuments }] = await productModel.aggregate(pipeline1);
    const totalPages = Math.ceil(totalDocuments / limit);

    pipeline.push({ $skip: skip }, { $limit: limit });
    const products = await productModel.aggregate(pipeline);

    const brands = await brandModel.find({ isListed: true });
    res.render("user/brands", {
      query: req.query,
      products,
      brands: brands,
      pageTitle: "Brands",
      breadcrumbs: [
        { name: "Home", link: "/user/home" },
        { name: "Brands", link: "/user/brands" },
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
      pageJs: "brands",
    });
  } catch (error) {
    console.log(error);
  }
};

// Sample controller showing how to structure data for the product details page

export const getProductDetails = async (req, res) => {
  try {
    // const productId = req.params.id;

    // This is sample data structure - replace with your database queries
    const product = {
      name: "iPhone 16 Pro",
      slug: "iphone-16-pro",
      price: 68500,
      originalPrice: 72990,
      rating: 4.8,
      reviewCount: 5,
      stock: 12,
      images: [
        "/image/iphone 17 pro blue image-1.webp",
        "/image/iphone 17 pro blue image-1.webp",
        "/image/iphone 17 pro blue image-3.webp",
        "/image/iphone 17 pro blue image-1.webp",
        "/image/oppo k13 turbo image 1.webp",
      ],
      offers: ["Gujarat Applies", "MOBILO ✓"],
      colors: [
        { name: "Black", code: "#000000" },
        { name: "Purple", code: "#800080" },
        { name: "Orange", code: "#FF8C00" },
        { name: "Gray", code: "#808080" },
      ],
      ramOptions: ["6 GB", "8 GB", "12 GB"],
      storageOptions: [
        { size: "128 GB", price: 68500 },
        { size: "256 GB", price: 75000 },
        { size: "512 GB", price: 85000 },
        { size: "1 TB", price: 95000 },
      ],
      description: {
        intro:
          "Experience the future of smartphone technology with the all-new iPhone 16 Pro. Designed with precision and packed with innovation, this device represents Apple's commitment to excellence.",
        display:
          'The stunning 6.7" Super Retina XDR display delivers incredible brightness and contrast, making everything from photos to videos come alive with remarkable detail. Powered by the groundbreaking A17 Bionic chip, the iPhone 16 Pro handles everything from everyday tasks to intensive gaming with unprecedented speed and efficiency.',
        camera:
          "Capture professional-quality photos and videos with the advanced 48MP + 12MP dual camera system. From stunning landscapes to detailed portraits, every shot is a masterpiece. And with the improved 5000mAh battery and 30W fast charging, you can stay powered throughout your day.",
      },
      reviews: {
        stats: {
          total: 5,
          5: 3,
          4: 1,
          3: 1,
          2: 0,
          1: 0,
        },
        items: [
          {
            author: "Alex Johnson",
            rating: 5,
            date: "March 15, 2025",
            verified: true,
            comment:
              "This is the best iPhone I've ever owned! The camera quality is phenomenal and the battery life is incredible. I can easily go a full day of heavy use without needing to charge.",
          },
          {
            author: "Priya Sharma",
            rating: 4,
            date: "March 15, 2025",
            verified: true,
            comment:
              "Great phone overall. The display is stunning and performance is top-notch. I'm taking off one star because I think the price is still a bit high compared to similar Android flagships.",
          },
          {
            author: "Michael Chen",
            rating: 5,
            date: "March 8, 2025",
            verified: true,
            comment:
              "Upgraded from an iPhone 13 and the difference is noticeable. The A17 chip makes everything lightning fast. The camera system is a massive upgrade - portrait mode photos look professional!",
          },
        ],
      },
    };

    // Sample related products
    const relatedProducts = [
      {
        name: "iPhone 16",
        slug: "iphone-16",
        image: "/images/products/iphone-16.jpg",
        price: 56999,
        rating: 4.7,
      },
      {
        name: "iPhone 16 Pro Max",
        slug: "iphone-16-pro-max",
        image: "/images/products/iphone-16-pro-max.jpg",
        price: 80999,
        rating: 4.9,
      },
      {
        name: "Samsung Galaxy S25",
        slug: "samsung-galaxy-s25",
        image: "/images/products/samsung-s25.jpg",
        price: 62999,
        rating: 4.6,
      },
      {
        name: "Google Pixel 9",
        slug: "google-pixel-9",
        image: "/images/products/pixel-9.jpg",
        price: 58999,
        rating: 4.5,
      },
    ];

    res.render("user/productDetails", {
      product,
      relatedProducts,
      pageTitle: `${product.name} - Mobiverse`,
      currentPage: "products",
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).render("error", {
      message: "Unable to load product details",
      pageTitle: "Error - Mobiverse",
    });
  }
};
