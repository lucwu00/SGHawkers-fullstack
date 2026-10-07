import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireStaff } from "../middleware/auth.js";

const UPLOAD_DIR = path.resolve("public/uploads/menu");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `menu-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg",".jpeg",".png",".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only jpg/png/webp allowed"));
  }
});

export const uploadsRouter = Router();

uploadsRouter.post("/menu-image", requireStaff, upload.array("images", 5), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });
  const urls = req.files.map(f => `/api/uploads/menu/${f.filename}`);
  res.json({ urls });
});

uploadsRouter.delete("/menu-image", requireStaff, (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No url provided" });
  const filePath = path.resolve("public" + url);
  // Safety check — only delete files inside our upload dir
  if (!filePath.startsWith(UPLOAD_DIR)) return res.status(403).json({ error: "Forbidden" });
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete" }); }
});