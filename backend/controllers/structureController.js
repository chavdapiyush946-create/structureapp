import * as service from "../services/structureService.js";

export const createStructure = async (req, res) => {
  try {
    const payload = { ...req.body, owner_id: req.user.id };
    const result = await service.createNode(payload);
    res.status(201).json(result);
  } catch (err) {
    console.error('createStructure error:', err);
    res.status(400).json({ error: err.message });
  }
};

export const getStructure = async (req, res) => {
  try {
    const tree = await service.getTree(req.user ? req.user.id : null);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStructure = async (req, res) => {
  try {
    const nodeId = req.params.id;
    const updates = req.body;
    const result = await service.updateNode(nodeId, updates, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteStructure = async (req, res) => {
  try {
    const nodeId = req.params.id;
    const result = await service.deleteNode(nodeId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getStructureChildren = async (req, res) => {
  try {
    const folderId = req.params.id;
    const children = await service.getNodeChildren(folderId, req.user ? req.user.id : null);
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


