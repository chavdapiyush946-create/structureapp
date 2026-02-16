import express from "express";
import upload from "../config/multer.js";
import { uploadFile, uploadMultipleFiles, downloadFile, getUploads, streamFile } from "../controllers/uploadController.js";
import { protect } from "../middlewares/authMiddleware.js"; // import must come before code

const router = express.Router();

// Public streaming endpoint: redirects to static /uploads/<filename>
// Placed before auth so browser <img> tags can load files without Authorization header
router.get("/stream/:id", streamFile);

// require authentication for uploads/downloads
router.use(protect);

router.post("/upload", upload.single("file"), uploadFile);
router.post("/upload-multiple", upload.array("files", 10), uploadMultipleFiles); // Max 10 files
router.get("/download/:id", downloadFile);
router.get("/uploads", getUploads);

export default router;

