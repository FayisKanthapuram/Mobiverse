// src/helpers/product.helpers.js
import cloudinary from "../config/cloudinary.js";

/**
 * Upload a buffer to cloudinary using cloudinaryUpload middleware function
 * But we will assume cloudinaryUpload(buffer, folder) returns { secure_url, public_id }
 * If your middleware has different signature, adapt accordingly.
 */

/**
 * Extract public id from cloudinary secure url (used for deletion)
 * Example secure_url: https://res.cloudinary.com/yourcloud/upload/v12345/ecommerce/products/abc123.png
 * Returns 'ecommerce/products/abc123' or the public_id used by your uploader.
 */
export function getPublicIdFromUrl(url) {
  if (!url) return null;
  const parts = url.split("/");
  const filename = parts.pop(); // e.g. abc123.png
  // the folder path after 'upload'
  const uploadIndex = parts.findIndex((p) => p === "upload");
  const folder = uploadIndex >= 0 ? parts.slice(uploadIndex + 1).join("/") : "";
  const name = filename.split(".")[0];
  // return folder + '/' + name (without v123 prefix)
  return `${folder.replace(/^v\d+\//, "")}/${name}`;
}

/**
 * Delete cloudinary public ids (array of public_id or derived from url)
 */
export async function deleteCloudinaryPublicIds(publicIds = []) {
  for (const id of publicIds) {
    try {
      await cloudinary.uploader.destroy(id);
    } catch (err) {
      console.warn("Cloudinary delete failed", id, err?.message || err);
    }
  }
}

/**
 * Rollback uploaded public_ids stored during an operation.
 * uploadRecords should be array of public_id strings.
 */
export async function rollbackCloudinary(uploadedPublicIds = []) {
  await deleteCloudinaryPublicIds(uploadedPublicIds);
}

/**
 * Utility: calculate minPrice, maxPrice, totalStock from variants array.
 * Each variant should have salePrice and stockQuantity (or stock).
 */
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
