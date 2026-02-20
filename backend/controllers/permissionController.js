import * as permissionService from "../services/permissionService.js";
import { getUsers } from "../services/userService.js";
import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);
export const grantPermission = async (req, res) => {
  try {
    const { folder_id, user_id, can_view, can_edit, can_delete, can_create, can_upload } = req.body;
    const grantedBy = req.user.id;

    // Validate required fields
    if (!folder_id || !user_id) {
      return res.status(400).json({ error: "folder_id and user_id are required" });
    }

    const rows = await query("SELECT owner_id FROM structure WHERE id = ?", [folder_id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const folder = rows[0];
    if (folder.owner_id !== grantedBy) {
      const hasEdit = await permissionService.checkUserPermission(grantedBy, folder_id, 'edit');
      if (!hasEdit) {
        return res.status(403).json({ error: "You are not allowed to change permissions on this folder" });
      }
    }

    const perm = await permissionService.grantPermission(
      folder_id,
      user_id,
      { can_view, can_edit, can_delete, can_create, can_upload },
      grantedBy
    );
    res.status(201).json(perm);
  } catch (err) {
    console.error("Error granting permission:", err);
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

export const getUsersWithPermissions = async (req, res) => {
  try {
    const { folder_id } = req.params;
    
    if (!folder_id) {
      return res.status(400).json({ error: "folder_id is required" });
    }

    // Verify the folder exists
    const folderRows = await query("SELECT id FROM structure WHERE id = ?", [folder_id]);
    if (!folderRows.length) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const usersWithPerms = await permissionService.getUsersWithPermissionsForFolder(folder_id);
    res.json(usersWithPerms);
  } catch (err) {
    console.error("Error fetching users with permissions:", err);
    res.status(500).json({ error: err.message });
  }
};
