import brandModel from "../../models/brandModel.js"
import productModal from "../../models/productModal.js";
import { productValidationSchema } from "../../validators/productValidator.js";
import variantModel from "../../models/variantModel.js";

export const loadProducts=async (req,res)=>{
    const brands=await brandModel.find({},{brandName:1}).lean();
    const product=await productModal.find().populate('brandID')
    const variants=await variantModel.find({productId:product._id})
    console.log(product)
    res.render("admin/products",{pageTitle:"Products",pageCss:'products',pageJs:'products',products:[{name:"oppo",images:['/images/default-product.png'],brand:"k30",minPrice:'100',maxPrice:'300',totalStock:300,status:'jk',}],brands})
}

export const addProduct = async (req, res) => {
  try {
    // Validate text fields
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Validate images
    if (!req.files || Object.keys(req.files).length !== 3) {
      return res
        .status(400)
        .json({ success: false, message: "Exactly 3 images are required" });
    }
    console.log("Validated data ✅:", req.body);

    const {productName,brand,description,isFeatured}=req.body;
    
    const checkName=await productModal.findOne({name:productName});
    if(checkName){
        return res.status(400).json({success:false,message:"Product name already exists"})
    }
    const checkBrand=await brandModel.findById(brand)
    if(!checkBrand){
        return res.status(400).json({success:false,message:"Invalid brand ID — brand not found in the database"});
    }
    let images=[];
    for(let image in req.files){
        images.push(req.files[image][0].path);
    }
    let status=req.body.status;
    status=status?'list':'unlist';

    const product=await productModal.create({name:productName,brandID:brand,images,description,isFeatured,status});
    const {regularPrice,salePrice,ram,storage,colour,stockQuantity}=JSON.parse(req.body.variants)[0];


    await variantModel.create({productId:product._id,regularPrice:(regularPrice)?regularPrice:0,salePrice,ram,storage,colour,stock:stockQuantity})

    // Proceed to save product in DB
    res.json({ success: true, message: "Product validated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};