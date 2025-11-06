import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/uploads/brands";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const baseName = path.basename(file.originalname, path.extname(file.originalname));
    const ext = path.extname(file.originalname).toLowerCase();

    // ✅ Keep .svg files as .svg (don’t force .png)
    if (ext === ".svg") {
      cb(null, `${Date.now()}-${baseName}.svg`);
    } else {
      cb(null, `${Date.now()}-${baseName}.png`);
    }
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = /jpeg|jpg|png|webp|svg/;
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export default upload;
