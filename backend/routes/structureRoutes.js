import express from "express";
import {
  createStructure,
  getStructure
} from "../controllers/structureController.js";

const router = express.Router();

router.post("/structure", createStructure);
router.get("/structure", getStructure);

export default router;
