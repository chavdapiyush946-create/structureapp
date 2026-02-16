import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);

const toBool = (v) => !!v;

/* -------------------- GRANT / UPDATE -------------------- */
export const grantPermission = async (folderId, userId, permissions, grantedBy) => {
  const perms = {
    can_view: toBool(permissions.can_view),
    can_edit: toBool(permissions.can_edit),
    can_delete: toBool(permissions.can_delete),
    can_create: toBool(permissions.can_create),
  };

  const existing = await query(
    "SELECT id FROM permissions WHERE folder_id = ? AND user_id = ?",
    [folderId, userId]
  );

  if (existing.length) {
    await query(
      `UPDATE permissions SET 
        can_view=?, can_edit=?, can_delete=?, can_create=?, 
        granted_by=?, updated_at=NOW()
       WHERE id=?`,
      [...Object.values(perms), grantedBy, existing[0].id]
    );

    return { id: existing[0].id, folder_id: folderId, user_id: userId, ...perms };
  }

  const result = await query(
    `INSERT INTO permissions 
      (folder_id, user_id, can_view, can_edit, can_delete, can_create, granted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [folderId, userId, ...Object.values(perms), grantedBy]
  );

  return { id: result.insertId, folder_id: folderId, user_id: userId, ...perms };
};

/* -------------------- REVOKE -------------------- */
export const revokePermission = async (permissionId) => {
  const { affectedRows } = await query(
    "DELETE FROM permissions WHERE id = ?",
    [permissionId]
  );

  if (!affectedRows) throw new Error("Permission not found");
  return { message: "Permission revoked" };
};

/* -------------------- GET FOLDER PERMISSIONS -------------------- */
export const getPermissionsForFolder = (folderId) =>
  query(
    `SELECT p.*, u.name AS user_name, u.email AS user_email
     FROM permissions p
     JOIN users u ON u.id = p.user_id
     WHERE p.folder_id = ?`,
    [folderId]
  );

/* -------------------- CHECK USER ACTION -------------------- */
export const checkUserPermission = async (userId, folderId, action) => {
  const map = {
    view: "can_view",
    edit: "can_edit",
    delete: "can_delete",
    create: "can_create",
  };

  if (!map[action]) return false;

  const rows = await query(
    `SELECT ${map[action]} AS allowed 
     FROM permissions 
     WHERE folder_id = ? AND user_id = ?`,
    [folderId, userId]
  );

  return !!rows[0]?.allowed;
};

/* -------------------- ACCESSIBLE NODE IDS -------------------- */
export const getAccessibleNodeIds = async (userId) => {
  const set = new Set();

  // Explicit view permissions
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

  // Owned nodes
  try {
    const owned = await query(
      "SELECT id FROM structure WHERE owner_id=?",
      [userId]
    );
    owned.forEach((o) => set.add(o.id));
  } catch (err) {
    if (err.code !== "ER_BAD_FIELD_ERROR") throw err;
  }

  // Propagate to children
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
