import brandModel from "../../models/brandModel.js"

export const loadProducts=async (req,res)=>{
    const brands=await brandModel.find({},{brandName:1}).lean();
    res.render("admin/products",{pageTitle:"Products",pageCss:'products',pageJs:'products',products:[{name:"oppo",images:['/images/default-product.png'],brand:"k30",minPrice:'100',maxPrice:'300',totalStock:300,status:'jk',}],brands})
}