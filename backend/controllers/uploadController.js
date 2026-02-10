import * as uploadService from "../services/uploadService.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { parent_id } = req.body;
    const file = req.file;

    const result = await uploadService.saveUploadedFile({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      parent_id: parent_id || null,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(400).json({ error: err.message });
  }
};

export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { parent_id } = req.body;
    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const result = await uploadService.saveUploadedFile({
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          parent_id: parent_id || null,
          fileSize: file.size,
          mimeType: file.mimetype,
        });
        results.push(result);
      } catch (err) {
        console.error(`Error uploading ${file.originalname}:`, err);
        errors.push({ filename: file.originalname, error: err.message });
      }
    }

    res.status(201).json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    console.error("Multiple upload error:", err);
    res.status(400).json({ error: err.message });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileData = await uploadService.getFileData(fileId);

    res.download(fileData.file_path, fileData.name);
  } catch (err) {
    console.error("Download error:", err);
    res.status(404).json({ error: err.message });
  }
};

export const getUploads = async (req, res) => {
  try {
    const uploads = await uploadService.getAllUploads();
    res.json(uploads);
  } catch (err) {
    console.error("Get uploads error:", err);
    res.status(500).json({ error: err.message });
  }
};
