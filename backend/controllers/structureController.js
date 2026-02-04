import * as service from "../services/structureService.js";

export const createStructure = async (req, res) => {
  try {
    const result = await service.createNode(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getStructure = async (req, res) => {
  try {
    const tree = await service.getTree();
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
