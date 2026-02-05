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

export const updateStructure = async (req, res) => {
  try {
    const nodeId = req.params.id;
    const updates = req.body;
    const result = await service.updateNode(nodeId, updates);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteStructure = async (req, res) => {
  try {
    const nodeId = req.params.id;
    const result = await service.deleteNode(nodeId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


