import { HttpStatus } from "../../constants/statusCode.js";
import brandModel from "../../models/brandModel.js";
import cartModel from "../../models/cartModel.js";
import productModel from "../../models/productModel.js";
import variantModel from "../../models/variantModel.js";
import { addToCartSchema } from "../../validators/cartValidator.js";

export const loadCart = async (req, res) => {
  const relatedProducts = await productModel.aggregate([
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
                  { $gte: ["$stock", 1] },
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
      $limit: 5,
    },
  ]);

  const items = await cartModel
    .find({ userId: req.session.user })
    .populate("productId")
    .populate("variantId");
  console.log(items);
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (let item of items) {
    subtotal += item.variantId.salePrice * item.quantity;
    if (item?.variantId?.regularPrice) {
      discount +=
        (item.variantId.regularPrice - item.variantId.salePrice) *
        item.quantity;
    }
  }

  res.render("user/cart", {
    pageTitle: "Cart",
    pageJs: "cart",
    cart: {
      subtotal,
      discount,
      items,
      tax,
    },
    relatedProducts,
  });
};

export const addToCart = async (req, res) => {
  try {
    const { error } = addToCartSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { variantId, quantity } = req.body;
    const variant = await variantModel
      .findById(variantId)
      .populate("productId");
    const brand = await brandModel.findById(variant.productId.brandID);
    if (!variant) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not found" });
    }
    if (!variant.isListed || !variant.productId.isListed || !brand.isListed) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not found" });
    }
    if (variant.stock < 1) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not in stock" });
    }
    const checkExist = await cartModel.findOne({
      userId: req.session.user,
      variantId: variant._id,
    });

    if (checkExist) {
      checkExist.quantity++;
      await checkExist.save();

      return res.status(HttpStatus.OK).json({
        success: true,
        message: "Product already existed in cart, quantity incremented",
      });
    }

    await cartModel.create({
      userId: req.session.user,
      productId: variant.productId,
      variantId: variant._id,
      quantity,
    });

    res.status(HttpStatus.CREATED).json({ success: true });
  } catch (error) {
    console.error("Error on add to cart", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await cartModel.findById(id).populate("variantId");
    if (!item) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not found" });
    }
    const quantity = req.body.quantity || 1;
    item.quantity = quantity;
    await item.save();
    let subtotal = 0;
    let discount = 0;
    const items = await cartModel
      .find({ userId: req.session.user })
      .populate("variantId")
      .lean();

    for (let item of items) {
      subtotal += item.variantId.salePrice * item.quantity;
      if (item?.variantId?.regularPrice) {
        discount +=
          (item.variantId.regularPrice - item.variantId.salePrice) *
          item.quantity;
      }
    }
    console.log("hello");
    return res.status(HttpStatus.ACCEPTED).json({
      success: true,
      updatedItem: {
        quantity,
        salePrice: item.variantId.salePrice,
        regularPrice: item.variantId.regularPrice,
        stock: item.variantId.stock,
      },
      cartTotals: {
        subtotal,
        discount,
      },
    });
  } catch (error) {
    console.error("Error on update", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await cartModel.findById(id);
    if (!item) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not found" });
    }
    await item.deleteOne();

    return res.status(HttpStatus.OK).json({
      success: true,
    });
  } catch (error) {
    console.error("Error on delete", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
