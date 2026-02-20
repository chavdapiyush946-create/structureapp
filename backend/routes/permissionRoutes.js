import express from "express";
import {
  grantPermission,
  listUsers,
  getUsersWithPermissions,
} from "../controllers/permissionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// all endpoints require auth
router.use(protect);

router.post("/permissions", grantPermission);

// user list for selecting grantee
router.get("/users", listUsers);

// get all users with their permissions for a specific folder
router.get("/folders/:folder_id/permissions", getUsersWithPermissions);

export default router;
