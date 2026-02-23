import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);

/* =====================================================
   SAVE FILE
===================================================== */
export const saveUploadedFile = async ({
  filename,
  originalName,
  filePath,
  parent_id,
  fileSize,
  mimeType,
  owner_id,
}) => {
  try {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const parent = parent_id || null;
    const owner = owner_id || null;

    // Insert into uploads
    const uploadResult = await query(
      `INSERT INTO uploads 
       (original_name, stored_name, file_path, file_size, mime_type, parent_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [originalName, filename, normalizedPath, fileSize, mimeType, parent]
    );

    // Insert into structure
    const structureResult = await query(
      `INSERT INTO structure 
       (name, type, parent_id, file_path, owner_id)
       VALUES (?, 'file', ?, ?, ?)`,
      [originalName, parent, normalizedPath, owner]
    );

    return {
      id: structureResult.insertId,
      upload_id: uploadResult.insertId,
      name: originalName,
      type: "file",
      parent_id: parent,
      file_path: normalizedPath,
      file_size: fileSize,
      mime_type: mimeType,
      owner_id: owner,
      created_at: new Date(),
    };

  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Failed to save file");
  }
};


/* =====================================================
   GET FILE BY ID
===================================================== */
export const getFileData = async (fileId) => {
  try {
    const rows = await query(
      `
      SELECT 
        s.*,
        u.file_size,
        u.mime_type,
        u.stored_name
      FROM structure s
      LEFT JOIN uploads u 
        ON u.file_path = s.file_path
      WHERE s.id = ? 
        AND s.type = 'file'
      `,
      [fileId]
    );

    if (!rows.length) throw new Error("File not found");

    return rows[0];

  } catch (err) {
    console.error("Database error:", err);
    throw new Error(err.message);
  }
};


/* =====================================================
   GET ALL UPLOADS
===================================================== */
export const getAllUploads = async () => {
  try {
    return await query(
      `
      SELECT 
        u.*,
        s.name AS display_name,
        s.parent_id
      FROM uploads u
      LEFT JOIN structure s 
        ON s.file_path = u.file_path
      ORDER BY u.created_at DESC
      `
    );

  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Failed to fetch uploads");
  }
};