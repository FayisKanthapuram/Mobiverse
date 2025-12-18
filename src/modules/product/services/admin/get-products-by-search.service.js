import { findProducts } from "../../repo/product.repo.js";
import { findVariantsByProduct } from "../../repo/variant.repo.js";

export const getProductsBySearch = async (q = "") => {
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  const products =await findProducts(query, { name: 1 }, 0, 20).populate("brandID").lean();
  for(let product of products){
    let variants=await findVariantsByProduct(product._id);
    product.minPrice=Infinity;
    for(let variant of variants){
      product.minPrice=Math.min(product.minPrice,variant.salePrice);
    }
    product.image=variants[0].images[0];
  }
  return products;
};
