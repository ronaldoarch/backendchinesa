import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import multer from "multer";
import { uploadFileController } from "../controllers/uploadsController";

export const uploadsRouter = Router();

const uploadDir = path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

uploadsRouter.post("/", upload.single("file"), uploadFileController);

