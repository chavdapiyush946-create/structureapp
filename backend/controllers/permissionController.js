import * as permissionService from "../services/permissionService.js";
import { getUsers } from "../services/userService.js";
import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);

export const grantPermission = async (req, res) => {
  try {
    const { folder_id, user_id, can_view, can_edit, can_delete, can_create, can_upload } = req.body;
    const grantedBy = req.user.id;
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
      { can_view, can_edit, can_delete, can_create, can_upload },
      grantedBy
    );
    res.status(201).json(perm);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
