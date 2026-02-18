import db from "../config/db.js";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const query = promisify(db.query).bind(db);

export const createNode = async ({ name, type, parent_id, file_path = null, owner_id }) => {
  // Validation
  if (!name || !type) {
    throw new Error("Name and type are required");
  }
  // owner_id may not exist in DB yet; we'll pass null if undefined
  
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

  // check permission on parent if provided
  if (parent_id) {
    const parentRows = await query("SELECT * FROM structure WHERE id = ?", [parent_id]);
    if (!parentRows.length) {
      throw new Error("Parent folder not found");
    }
    const parent = parentRows[0];
    // if owner_id column is missing it'll be undefined
    if (parent.owner_id !== owner_id && owner_id) {
      const { checkUserPermission } = await import("./permissionService.js");
      const allowed = await checkUserPermission(owner_id, parent_id, 'create');
      if (!allowed) {
        throw new Error("You do not have permission to create inside this folder");
      }
    }
  }

  // if owner_id undefined/null and column doesn't exist this may fail; we'll catch
  const sql = `
    INSERT INTO structure (name, type, parent_id, file_path, owner_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const result = await query(sql, [name, type, parent_id || null, file_path, owner_id || null]);
    return { 
      id: result.insertId, 
      name, 
      type, 
      parent_id: parent_id || null,
      file_path,
      owner_id,
      created_at: new Date()
    };
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('owner_id')) {
      // column doesn't exist yet; retry without owner_id
      try {
        const sql2 = `
          INSERT INTO structure (name, type, parent_id, file_path)
          VALUES (?, ?, ?, ?)
        `;
        const result2 = await query(sql2, [name, type, parent_id || null, file_path]);
        return { 
          id: result2.insertId, 
          name, 
          type, 
          parent_id: parent_id || null,
          file_path,
          created_at: new Date()
        };
      } catch (err2) {
        console.error('Database error on fallback insert:', err2);
        throw new Error('Failed to create structure node');
      }
    }
    console.error('Database error:', err);
    throw new Error("Failed to create structure node");
  }
};

/* GET TREE STRUCTURE */
export const getTree = async (userId) => {
  try {
    const rows = await query("SELECT * FROM structure ORDER BY type ASC, name ASC");    
    // if no userId passed, return full tree
    if (!userId) {
      const map = {};
      const tree = [];
      rows.forEach(r => {
        map[r.id] = { ...r, children: [] };
      });
      rows.forEach(r => {
        if (r.parent_id && map[r.parent_id]) {
          map[r.parent_id].children.push(map[r.id]);
        } else if (!r.parent_id) {
          tree.push(map[r.id]);
        }
      });
      return tree;
    }

    // filter by permissions/view
    try {
      const { getAccessibleNodeIds, checkUserPermission } = await import("./permissionService.js");
      const accessible = await getAccessibleNodeIds(userId);
      const filtered = rows.filter(r => accessible.has(r.id));
      const map = {};
      const tree = [];
      filtered.forEach(r => {
        map[r.id] = { ...r, children: [] };
      });
      filtered.forEach(r => {
        if (r.parent_id && map[r.parent_id]) {
          map[r.parent_id].children.push(map[r.id]);
        } else if (!r.parent_id) {
          tree.push(map[r.id]);
        }
      });

      // attach permission flags for current user on each node
      const attachPerms = async () => {
        const ids = Object.keys(map).map(Number);
        for (const id of ids) {
          map[id].can_view = await checkUserPermission(userId, id, 'view');
          map[id].can_edit = await checkUserPermission(userId, id, 'edit');
          map[id].can_delete = await checkUserPermission(userId, id, 'delete');
          map[id].can_create = await checkUserPermission(userId, id, 'create');
          map[id].can_upload = await checkUserPermission(userId, id, 'upload');
        }
      };
      await attachPerms();
      return tree;
    } catch (permErr) {
      // if permissions fail (e.g. missing owner_id column), return full tree
      console.warn('Permission check failed, returning unfiltered tree', permErr);
      const map = {};
      const tree = [];
      rows.forEach(r => {
        map[r.id] = { ...r, children: [] };
      });
      rows.forEach(r => {
        if (r.parent_id && map[r.parent_id]) {
          map[r.parent_id].children.push(map[r.id]);
        } else if (!r.parent_id) {
          tree.push(map[r.id]);
        }
      });
      return tree;
    }
  } catch (err) {
    console.error('Database error:', err);
    throw new Error("Failed to fetch structure");
  }
};
/* UPDATE NODE */
export const updateNode = async (nodeId, updates, userId) => {
  try {
    const result = await query("SELECT * FROM structure WHERE id = ?", [nodeId]);
    if (!result.length) {
      throw new Error("Node not found");
    }
    const currentNode = result[0];
    // permission check: owner or edit permission (skip if owner_id not stored yet)
    if (currentNode.owner_id !== undefined && currentNode.owner_id !== null && currentNode.owner_id !== userId) {
      const { checkUserPermission } = await import("./permissionService.js");
      const allowed = await checkUserPermission(userId, nodeId, 'edit');
      if (!allowed) {
        throw new Error("You do not have permission to edit this node");
      }
    }

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

export const deleteNode = async (nodeId, userId) => {
  try {
    const rows = await query(
      "SELECT * FROM structure WHERE id = ?",
      [nodeId]
    );

    if (!rows.length) {
      throw new Error("Node not found");
    }

    const node = rows[0];

    // permission check: owner or delete (skip if owner_id missing)
    if (node.owner_id !== undefined && node.owner_id !== null && node.owner_id !== userId) {
      const { checkUserPermission } = await import("./permissionService.js");
      const allowed = await checkUserPermission(userId, nodeId, 'delete');
      if (!allowed) {
        throw new Error("You do not have permission to delete this node");
      }
    }

    if (node.type === "folder") {
      await checkFolderEmpty(nodeId);
    }

    return await performDelete(nodeId);
  } catch (err) {
    console.error(err);
    throw new Error(err.message || "Failed to delete node");
  }
};

// Get children of a specific folder (filtered by permissions if userId provided)
export const getNodeChildren = async (folderId, userId) => {
  try {
    const rows = await query(
      "SELECT * FROM structure WHERE parent_id = ? ORDER BY type DESC, name ASC",
      [folderId]
    );
    if (!userId) return rows;
    try {
      const { getAccessibleNodeIds, checkUserPermission } = await import("./permissionService.js");
      const accessible = await getAccessibleNodeIds(userId);
      const filtered = rows.filter(r => accessible.has(r.id));
      // attach permission flags
      for (const r of filtered) {
        r.can_view = await checkUserPermission(userId, r.id, 'view');
        r.can_edit = await checkUserPermission(userId, r.id, 'edit');
        r.can_delete = await checkUserPermission(userId, r.id, 'delete');
        r.can_create = await checkUserPermission(userId, r.id, 'create');
        r.can_upload = await checkUserPermission(userId, r.id, 'upload');
      }
      return filtered;
    } catch (permErr) {
      console.warn('Permission check failed in getNodeChildren, returning unfiltered rows', permErr);
      return rows;
    }
  } catch (err) {
    console.error('Database error:', err);
    throw new Error("Failed to fetch children");
  }
};


