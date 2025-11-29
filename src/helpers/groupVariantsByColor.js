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
