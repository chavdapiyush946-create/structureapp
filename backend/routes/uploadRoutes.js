import express from "express";
import upload from "../config/multer.js";
import { uploadFile, uploadMultipleFiles, downloadFile, getUploads } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);
router.post("/upload-multiple", upload.array("files", 10), uploadMultipleFiles); // Max 10 files
router.get("/download/:id", downloadFile);
router.get("/uploads", getUploads);

export default router;
