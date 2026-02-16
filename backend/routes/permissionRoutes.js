import express from "express";
import {
  grantPermission,
  revokePermission,
  listPermissions,
  listUsers,
} from "../controllers/permissionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// all endpoints require auth
router.use(protect);

router.post("/permissions", grantPermission);
router.get("/permissions/:folderId", listPermissions);
router.delete("/permissions/:id", revokePermission);

// user list for selecting grantee
router.get("/users", listUsers);

export default router;