import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);
const toNull = (v) => v || null;

// Normalize path (Windows → Unix)
const normalizePath = (path) => path.replace(/\\/g, "/");


const getUniqueFileName = async (name, parent_id) => {
  
  const sql = `
    SELECT COUNT(*) AS count

    FROM structure 
    WHERE name = ? AND parent_id <=> ? AND type = 'file'
  `;

  const [{ count }] = await query(sql, [name, toNull(parent_id)]);
  if (!count) return name;

  const timestamp = Date.now();
  const dotIndex = name.lastIndexOf(".");

  return dotIndex > 0
    ? `${name.slice(0, dotIndex)}-${timestamp}${name.slice(dotIndex)}`
    : `${name}-${timestamp}`;
};

// ---------------- SAVE FILE ----------------
export const saveUploadedFile = async ({
  filename,
  originalName,
  filePath,
  parent_id,
  fileSize,
  mimeType,
}) => {
  try {
    const normalizedPath = normalizePath(filePath);
    const finalName = await getUniqueFileName(originalName, parent_id);

    // Save in uploads table
    const uploadResult = await query(
      `INSERT INTO uploads 
       (original_name, stored_name, file_path, file_size, mime_type, parent_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        originalName,
        filename,
        normalizedPath,
        fileSize,
        mimeType,
        toNull(parent_id),
      ]
    );

    // Save in structure table
    const structureResult = await query(
      `INSERT INTO structure (name, type, parent_id, file_path)
       VALUES (?, 'file', ?, ?)`,
      [finalName, toNull(parent_id), normalizedPath]
    );

    return {
      id: structureResult.insertId,
      upload_id: uploadResult.insertId,
      name: finalName,
      type: "file",
      parent_id: toNull(parent_id),
      file_path: normalizedPath,
      file_size: fileSize,
      mime_type: mimeType,
      created_at: new Date(),
    };
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Failed to save file information");
  }
};

// ---------------- GET FILE ----------------
export const getFileData = async (fileId) => {
  try {
    const [file] = await query(
      `
      SELECT s.*, u.file_size, u.mime_type, u.stored_name
      FROM structure s
      LEFT JOIN uploads u ON s.file_path = u.file_path
      WHERE s.id = ? AND s.type = 'file'
      `,
      [fileId]
    );

    if (!file) throw new Error("File not found");
    return file;
  } catch (err) {
    console.error("Database error:", err);
    throw new Error(err.message || "Failed to fetch file data");
  }
};


export const getAllUploads = async () => {
  try {
    return await query(
      `
      SELECT u.*, s.name AS display_name, s.parent_id
      FROM uploads u
      LEFT JOIN structure s ON u.file_path = s.file_path
      ORDER BY u.created_at DESC
      `
    );
  } catch (err) {
    console.error("Database error:", err);
    throw new Error("Failed to fetch uploads");
  }
};


