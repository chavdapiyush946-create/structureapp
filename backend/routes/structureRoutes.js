import express from "express";
import {
  createStructure,
  getStructure,
  updateStructure,
  deleteStructure
} from "../controllers/structureController.js";

const router = express.Router();

router.post("/structure", createStructure);
router.get("/structure", getStructure);
router.put("/structure/:id", updateStructure);
router.delete("/structure/:id", deleteStructure);

export default router;

