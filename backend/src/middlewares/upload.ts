// /backend/src/middlewares/upload.ts
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// uploads/img 절대경로 만들기
const UPLOAD_IMG_PATH = path.resolve(__dirname, "../../uploads/img");

// 폴더 없으면 생성
if (!fs.existsSync(UPLOAD_IMG_PATH)) {
  fs.mkdirSync(UPLOAD_IMG_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_IMG_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + "_" + Date.now() + ext);
  }
});

export const upload = multer({ storage });
