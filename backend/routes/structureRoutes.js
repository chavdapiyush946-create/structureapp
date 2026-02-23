import express from "express";
import {
  createStructure,
  getStructure,
  getStructureChildren,
  updateStructure,
  deleteStructure
} from "../controllers/structureController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// require authentication for all structure endpoints
router.use(protect);

router.post("/", createStructure);
router.get("/", getStructure);
router.get("/:id", getStructureChildren);
router.put("/:id", updateStructure);
router.delete("/:id", deleteStructure);

export default router;

