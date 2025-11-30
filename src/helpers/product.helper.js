export const groupVariantsByColor = (variants) => {
  const colorGroups = {};

  variants.forEach((v) => {
    if (!colorGroups[v.colour]) colorGroups[v.colour] = [];
    colorGroups[v.colour].push(v);
  });

  // Sort by price inside each color group
  for (const color in colorGroups) {
    colorGroups[color].sort((a, b) => a.salePrice - b.salePrice);
  }

  return colorGroups;
};

export const getAppliedOffer=(data,salePrice)=>{
  let offer=0;
  if(data?.productOffer?.length>0){
    for(let productOffer of data.productOffer){
      let x=0
      if(productOffer.discountType==='percentage'){
        x=salePrice*productOffer.discountValue*0.01;
      }else{
        x=brandOffer.discountValue;
      }
      offer=Math.max(x,offer);
    }
  }
  if(data?.brandOffer?.length>0){
    for(let brandOffer of data.brandOffer){
      let x=0
      if(brandOffer.discountType==='percentage'){
        x=salePrice*brandOffer.discountValue*0.01;
      }else{
        x=brandOffer.discountValue;
      }
      offer=Math.max(x,offer);
    }
  }
  return offer;
}