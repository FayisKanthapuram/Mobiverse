// src/helpers/product.helpers.js
import cloudinary from "../../../config/cloudinary.js";

export function getPublicIdFromUrl(url) {
  if (!url) return null;
  const parts = url.split("/");
  const filename = parts.pop(); 
  const uploadIndex = parts.findIndex((p) => p === "upload");
  const folder = uploadIndex >= 0 ? parts.slice(uploadIndex + 1).join("/") : "";
  const name = filename.split(".")[0];
  return `${folder.replace(/^v\d+\//, "")}/${name}`;
}

export async function deleteCloudinaryPublicIds(publicIds = []) {
  for (const id of publicIds) {
    try {
      await cloudinary.uploader.destroy(id);
    } catch (err) {
      console.warn("Cloudinary delete failed", id, err?.message || err);
    }
  }
}

export async function rollbackCloudinary(uploadedPublicIds = []) {
  await deleteCloudinaryPublicIds(uploadedPublicIds);
}

export function calcMinMaxStock(variants = []) {
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalStock = 0;

  for (const v of variants) {
    const price = Number(v.salePrice ?? v.salePrice);
    const stock = Number(v.stockQuantity ?? v.stock ?? 0);
    if (!Number.isNaN(price)) {
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
    totalStock += isFinite(stock) ? stock : 0;
  }

  if (minPrice === Infinity) minPrice = 0;
  if (maxPrice === -Infinity) maxPrice = 0;

  return { minPrice, maxPrice, totalStock };
}

