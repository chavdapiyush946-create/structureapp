import * as permissionService from "../services/permissionService.js";
import { getUsers } from "../services/userService.js";
import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);

export const grantPermission = async (req, res) => {
  try {
    const { folder_id, user_id, can_view, can_edit, can_delete, can_create } = req.body;
    const grantedBy = req.user.id;
    // ensure granter is owner or has edit rights
    const rows = await query("SELECT owner_id FROM structure WHERE id = ?", [folder_id]);
    if (!rows.length) {
      throw new Error("Folder not found");
    }
    const folder = rows[0];
    if (folder.owner_id !== grantedBy) {
      const hasEdit = await permissionService.checkUserPermission(grantedBy, folder_id, 'edit');
      if (!hasEdit) {
        throw new Error("You are not allowed to change permissions on this folder");
      }
    }

    const perm = await permissionService.grantPermission(
      folder_id,
      user_id,
      { can_view, can_edit, can_delete, can_create },
      grantedBy
    );
    res.status(201).json(perm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const revokePermission = async (req, res) => {
  try {
    const id = req.params.id;
    // ensure user has right to revoke (owner or edit on associated folder)
    const rows = await query(
      `SELECT p.folder_id, s.owner_id
       FROM permissions p
       JOIN structure s ON s.id = p.folder_id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) throw new Error("Permission entry not found");
    const { folder_id, owner_id } = rows[0];
    const requester = req.user.id;
    if (owner_id !== requester) {
      const hasEdit = await permissionService.checkUserPermission(requester, folder_id, 'edit');
      if (!hasEdit) {
        throw new Error("You are not allowed to revoke this permission");
      }
    }
    const result = await permissionService.revokePermission(id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listPermissions = async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const list = await permissionService.getPermissionsForFolder(folderId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
