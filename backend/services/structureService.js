import db from "../config/db.js";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const query = promisify(db.query).bind(db);

export const createNode = async ({ name, type, parent_id, file_path = null }) => {
  // Validation
  if (!name || !type) {
    throw new Error("Name and type are required");
  }
  
  if (name.length > 255) {
    throw new Error("name very long");
  }

  if (name.trim() === "") {
    throw new Error("name cannot be empty");
  }

  if (!['file', 'folder'].includes(type)) {
    throw new Error("Type must be 'file' or 'folder'");
  }

  if (type === "file" && !parent_id) {
    throw new Error("File must be inside a folder");
  }

  const sql = `
    INSERT INTO structure (name, type, parent_id, file_path)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const result = await query(sql, [name, type, parent_id || null, file_path]);
    return { 
      id: result.insertId, 
      name, 
      type, 
      parent_id: parent_id || null,
      file_path,
      created_at: new Date()
    };
  } catch (err) {
    console.error('Database error:', err);
    throw new Error("Failed to create structure node");
  }
};

/* GET TREE STRUCTURE */
export const getTree = async () => {
  try {
    const rows = await query("SELECT * FROM structure ORDER BY type ASC, name ASC");    
    const map = {};
    const tree = [];
    // Create map of all nodes
    rows.forEach(r => {
      map[r.id] = { ...r, children: [] };
    });
    // Build tree structure
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id]);
      } else if (!r.parent_id) {
        tree.push(map[r.id]);
      }
    });
    return tree;
  } catch (err) {
    console.error('Database error:', err);
    throw new Error("Failed to fetch structure");
  }
};
/* UPDATE NODE */
export const updateNode = async (nodeId, updates) => {
  try {
    const result = await query("SELECT * FROM structure WHERE id = ?", [nodeId]);
    if (!result.length) {
      throw new Error("Node not found");
    }
    const currentNode = result[0];
    const updateData = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.type !== undefined && { type: updates.type }),
    };
    if (!Object.keys(updateData).length) {
      return currentNode;
    }
    if (updateData.name !== undefined && !updateData.name.trim()) {
      throw new Error("Name cannot be empty");
    }
    if (
      updateData.type !== undefined &&
      !["file", "folder"].includes(updateData.type)
    ) {
      throw new Error("Type must be 'file' or 'folder'");
    }
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");

    await query(
      `UPDATE structure SET ${fields} WHERE id = ?`,
      [...Object.values(updateData), nodeId]
    );
    return { ...currentNode, ...updateData };
  } catch (err) {
    console.error(err);
    throw new Error(err.message || "Failed to update node");
  }
};

const checkFolderEmpty = async (nodeId) => {
  try {
    const rows = await query(
      "SELECT COUNT(*) AS count FROM structure WHERE parent_id = ?",
      [nodeId]
    );

    if (rows[0].count > 0) {
      throw new Error("Cannot delete folder with children. Delete children first.");
    }
  } catch (err) {
    console.error(err);
    throw new Error(err.message || "Failed to check children");
  }
};

const performDelete = async (nodeId) => {
  try {
    // Get node info before deleting to check if it has a file
    const nodeRows = await query("SELECT * FROM structure WHERE id = ?", [nodeId]);
    
    if (!nodeRows.length) {
      throw new Error("Node not found");
    }

    const node = nodeRows[0];
    
    // Delete from database
    const result = await query("DELETE FROM structure WHERE id = ?", [nodeId]);

    if (!result.affectedRows) {
      throw new Error("Node not found");
    }

    // If it's a file with a file_path, delete the physical file
    if (node.type === 'file' && node.file_path) {
      try {
        const filePath = path.join(__dirname, '..', node.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileErr) {
        console.error('Error deleting physical file:', fileErr);
        // Don't throw error, database record is already deleted
      }
    }

    return { message: "Node deleted successfully" };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to delete node");
  }
};

export const deleteNode = async (nodeId) => {
  try {
    const rows = await query(
      "SELECT id, type FROM structure WHERE id = ?",
      [nodeId]
    );

    if (!rows.length) {
      throw new Error("Node not found");
    }

    const { type } = rows[0];

    if (type === "folder") {
      await checkFolderEmpty(nodeId);
    }

    return await performDelete(nodeId);
  } catch (err) {
    console.error(err);
    throw new Error(err.message || "Failed to delete node");
  }
};

// Get children of a specific folder
export const getNodeChildren = async (folderId) => {
  try {
    const rows = await query(
      "SELECT * FROM structure WHERE parent_id = ? ORDER BY type DESC, name ASC",
      [folderId]
    );
    return rows;
  } catch (err) {
    console.error('Database error:', err);
    throw new Error("Failed to fetch children");
  }
};


