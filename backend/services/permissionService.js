import db from "../config/db.js";
import { promisify } from "util";
import { getUsers } from "./userService.js";

const query = promisify(db.query).bind(db);
const toBool = (v) => !!v;

/* -------------------- GRANT / UPDATE -------------------- */
export const grantPermission = async (folderId, userId, permissions, grantedBy) => {
  const perms = {
    can_view: toBool(permissions.can_view),
    can_edit: toBool(permissions.can_edit),
    can_delete: toBool(permissions.can_delete),
    can_create: toBool(permissions.can_create),
    can_upload: toBool(permissions.can_upload),
  };

  const existing = await query(
    "SELECT id FROM permissions WHERE folder_id = ? AND user_id = ?",
    [folderId, userId]
  );

  if (existing.length) {
    await query(
      `UPDATE permissions SET 
        can_view=?, can_edit=?, can_delete=?, can_create=?, can_upload=?,        
        granted_by=?, updated_at=NOW()
       WHERE id=?`,
      [...Object.values(perms), grantedBy, existing[0].id]
    );
    return { id: existing[0].id, folder_id: folderId, user_id: userId, ...perms };
  }

  const result = await query(
    `INSERT INTO permissions
      (folder_id, user_id, can_view, can_edit, can_delete, can_create, can_upload, granted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [folderId, userId, ...Object.values(perms), grantedBy]
  );
    return { id: result.insertId, folder_id: folderId, user_id: userId, ...perms };
};

/* -------------------- CHECK USER ACTION -------------------- */
export const checkUserPermission = async (userId, folderId, action) => {
  const map = {
    view: "can_view",
    edit: "can_edit",
    delete: "can_delete",
    create: "can_create",
    upload: "can_upload",
  };

  if (!map[action]) return false;
  
  // Get the folder and all its parents (only call once)
  const getParentChain = async (fid) => {
    const chain = [];
    let currentId = fid;
    const visited = new Set();
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      chain.push(currentId);
      const rows = await query(
        "SELECT parent_id FROM structure WHERE id = ?",
        [currentId]
      );
      currentId = rows.length ? rows[0].parent_id : null;
    }
    return chain;
  };
  
  // helper that tests explicit permission on a specific folder
  const hasPerm = async (fid) => {
    const rows = await query(
      `SELECT ${map[action]} AS allowed 
       FROM permissions 
       WHERE folder_id = ? AND user_id = ?`,
      [fid, userId]
    );
    return !!rows[0]?.allowed;
  };

  try {
    // Get parent chain once
    const parentChain = await getParentChain(folderId);
    
    // Check if user owns any folder in the chain
    for (const id of parentChain) {
      try {
        const folderRows = await query(
          "SELECT owner_id FROM structure WHERE id = ?",
          [id]
        );
        if (folderRows.length && folderRows[0].owner_id === userId) {
          return true;
        }
      } catch (err) {
        // owner_id column might not exist, continue
      }
    }
    
    // Check explicit permissions on any folder in the chain (inherited)
    for (const id of parentChain) {
      if (await hasPerm(id)) {        
        return true;
      }
    }
  } catch (err) {
    console.error("Error checking permission:", err);
    return false;
  }
  
  return false;
};

/* ---------- ACCESSIBLE NODE IDS -------------------- */
export const getAccessibleNodeIds = async (userId) => {
  const set = new Set();  

  try {
    const perms = await query(
      "SELECT folder_id FROM permissions WHERE user_id=? AND can_view=1",      
      [userId]
    );
    perms.forEach((p) => set.add(p.folder_id));
  } catch (err) {
    if (!["ER_NO_SUCH_TABLE", "ER_BAD_TABLE_ERROR"].includes(err.code))
      throw err;
  }

  // Nodes owned by the user
  try {    
    const owned = await query(
      "SELECT id FROM structure WHERE owner_id=?",
      [userId],
    );
    owned.forEach((o) => set.add(o.id));
  } catch (err) {
    if (err.code !== "ER_BAD_FIELD_ERROR") throw err;
  }
  const all = await query("SELECT id, parent_id FROM structure");

  let changed;
  do {
    changed = false;
    all.forEach(({ id, parent_id }) => {
      if (!set.has(id) && parent_id && set.has(parent_id)) {  
        set.add(id);
        changed = true;
      }
    });
  } while (changed);
  return set;
};

/* -------------------- FETCH ALL USERS WITH PERMISSIONS FOR FOLDER -------------------- */
export const getUsersWithPermissionsForFolder = async (folderId) => {
  try {
    const users = await getUsers();
    
    // For each user, fetch their permissions for this specific folder
    const usersWithPerms = await Promise.all(
      users.map(async (user) => {
        const perms = await query(
          `SELECT can_view, can_edit, can_delete, can_create, can_upload
           FROM permissions 
           WHERE folder_id = ? AND user_id = ?`,
          [folderId, user.id]
        );
        
        return {
          ...user,
          can_view: toBool(perms[0]?.can_view),
          can_edit: toBool(perms[0]?.can_edit),
          can_delete: toBool(perms[0]?.can_delete),
          can_create: toBool(perms[0]?.can_create),
          can_upload: toBool(perms[0]?.can_upload),
        };
      })
    );
    
    return usersWithPerms;
  } catch (err) {
    console.error("Error fetching users with permissions:", err);
    throw err;
  }
};

