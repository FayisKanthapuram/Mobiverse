export const loadBrands=(req,res)=>{
    res.render("admin/brands",{pageTitle:"Brands",pageCss:"brands",pageJs:"brands",brands:[{name:'apple',productCount:30}]})
}
