import { log } from "console";
import * as uploadService from "../services/uploadService.js";
import * as permissionService from "../services/permissionService.js";
import fs from "fs";
import path from "path";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { parent_id } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    // Require explicit upload permission on parent folder
    if (parent_id) {
      const hasUploadPermission = await permissionService.checkUserPermission(userId, parent_id, 'upload');
      if (!hasUploadPermission) {
        return res.status(403).json({ error: "You do not have permission to upload files in this folder" });
      }
    }
    const result = await uploadService.saveUploadedFile({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      parent_id: parent_id || null,
      fileSize: file.size,
      mimeType: file.mimetype,
      owner_id: userId,
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
    const userId = req.user?.id;
    const results = [];
    const errors = [];

    // Require explicit upload permission on parent folder
    if (parent_id) {
      const hasUploadPermission = await permissionService.checkUserPermission(userId, parent_id, 'upload');
      if (!hasUploadPermission) {
        return res.status(403).json({ error: "You do not have permission to upload files in this folder" });
      }
    }

    for (const file of req.files) {
      try {
        const result = await uploadService.saveUploadedFile({
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          parent_id: parent_id || null,
          fileSize: file.size,
          mimeType: file.mimetype,
          owner_id: userId,
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
    console.log('Download request for file ID:', fileId);
    
    const fileData = await uploadService.getFileData(fileId);
    console.log('File data:', { 
      name: fileData.name, 
      path: fileData.file_path, 
      mime: fileData.mime_type,
      stored_name: fileData.stored_name 
    });
    // Get absolute file path
    const filePath = path.resolve(fileData.file_path);
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Check if it's a video file
    const ext = fileData.name.split('.').pop().toLowerCase();
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const previewableTypes = [...videoTypes, ...imageTypes, 'pdf'];
    
    if (videoTypes.includes(ext)) {
      console.log('Streaming video file:', fileData.name);
      
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      console.log('Video file size:', fileSize, 'Range header:', range);

      if (range) {
        // Parse range header
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        console.log(`Sending range: ${start}-${end}/${fileSize}`);
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': fileData.mime_type || 'video/mp4',
          'Access-Control-Allow-Origin': '*',
        });
        
        file.pipe(res);
      } else {
        // No range, send entire file
        console.log('Sending entire video file');
        
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': fileData.mime_type || 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        });
        
        fs.createReadStream(filePath).pipe(res);
      }
    } else if (previewableTypes.includes(ext)) {
      // Stream other previewable files (images, PDFs)
      console.log('Serving previewable file:', fileData.name);
      res.setHeader('Content-Type', fileData.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileData.name + '"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(filePath);
    } else {
      // Force download for other file types
      console.log('Forcing download for:', fileData.name);
      res.download(filePath, fileData.name);
    }
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


export const streamFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileData = await uploadService.getFileData(fileId);
    const filename = path.basename(fileData.file_path);
    res.redirect(`/uploads/${filename}`);
  } catch (err) {
    console.error("Stream error:", err);
    res.status(404).json({ error: err.message });
  }
};

