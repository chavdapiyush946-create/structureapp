import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);
const toNull = (v) => v || null;

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
  owner_id,
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

    // Save in structure table (include owner_id if available)
    let structureResult;
    try {
      structureResult = await query(
        `INSERT INTO structure (name, type, parent_id, file_path, owner_id)
         VALUES (?, 'file', ?, ?, ?)`,
        [finalName, toNull(parent_id), normalizedPath, owner_id || null]
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('owner_id')) {
        // fallback if owner_id column doesn't exist
        structureResult = await query(
          `INSERT INTO structure (name, type, parent_id, file_path)
           VALUES (?, 'file', ?, ?)`,
          [finalName, toNull(parent_id), normalizedPath]
        );
      } else {
        throw err;
      }
    }
    // Try to resolve owner_name if owner_id provided
    let owner_name = null;
    if (owner_id) {
      try {
        const rows = await query(`SELECT name FROM users WHERE id = ?`, [owner_id]);
        owner_name = rows[0]?.name || null;
      } catch (e) {
        // ignore
      }
    }

    return {
      id: structureResult.insertId,
      upload_id: uploadResult.insertId,
      name: finalName,
      type: "file",
      parent_id: toNull(parent_id),
      file_path: normalizedPath,
      file_size: fileSize,
      mime_type: mimeType,
      owner_id: owner_id || null,
      owner_name,
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


