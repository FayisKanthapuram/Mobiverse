import multer from "multer";
import cloudinary from "../../config/cloudinary.js";
import path from "path";

// Multer memory storage
const storage = multer.memoryStorage();

// Allowed file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = /jpeg|jpg|png|webp|svg/;
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const uploadFile = multer({ storage, fileFilter });

// 🔥 Cloudinary uploader (buffer-based)
export const cloudinaryUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `ecommerce/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    upload.end(fileBuffer);
  });
};

// Export different upload types
const upload = {
  brand: uploadFile.single("brandLogo"),   // brand
  product: uploadFile.any(),  // product multiple images
  customer: uploadFile.single("image"),
  banner: uploadFile.single("image"),
  user: uploadFile.single("image"),
};

export default upload;
