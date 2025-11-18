// middlewares/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Reusable function to create storage for any folder
const createStorage = (folderName) => {
  const uploadDir = path.join("public", "uploads", folderName);

  // Make sure folder exists
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const baseName = path.basename(file.originalname, path.extname(file.originalname));
      const ext = path.extname(file.originalname).toLowerCase();

      // Keep .svg as is
      if (ext === ".svg") cb(null, `${Date.now()}-${baseName}.svg`);
      else cb(null, `${Date.now()}-${baseName}.png`);
    },
  });
};

// ✅ File filter for images
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = /jpeg|jpg|png|webp|svg/;
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

// ✅ Export different upload middlewares
const upload = {
  brand: multer({ storage: createStorage("brands"), fileFilter }),
  product: multer({ storage: createStorage("products"), fileFilter }),
  customer: multer({ storage: createStorage("customers"), fileFilter }),
  banner: multer({ storage: createStorage("banners"), fileFilter }),
  user: multer({ storage: createStorage("user"), fileFilter }),
};

export default upload;
