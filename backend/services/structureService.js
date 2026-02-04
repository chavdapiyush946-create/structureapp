import db from "../config/db.js";

/* CREATE FILE / FOLDER */
export const createNode = ({ name, type, parent_id }) => {
  return new Promise((resolve, reject) => {
    // Validation
    if (!name || !type) {
      return reject(new Error("Name and type are required"));
    }
    
    if (!['file', 'folder'].includes(type)) {
      return reject(new Error("Type must be 'file' or 'folder'"));
    }

    
    
    if (type === "file" && !parent_id) {
      return reject(new Error("File must be inside a folder"));
    }
    
    
    const sql = `
      INSERT INTO structure (name, type, parent_id)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [name, type, parent_id || null], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return reject(new Error("Failed to create structure node"));
      }
      resolve({ 
        id: result.insertId, 
        name, 
        type, 
        parent_id: parent_id || null,
        created_at: new Date()
      });
    });
  });
};

/* GET TREE STRUCTURE */
export const getTree = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM structure ORDER BY type ASC, name ASC", (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return reject(new Error("Failed to fetch structure"));
      }

      const map = {};
      const tree = [];

      // Create map of all nodes
      rows.forEach(r => {
        map[r.id] = { ...r, children: [] };
      });

      // Build tree structure
      rows.forEach(r => {
        if (r.parent_id && map[r.parent_id]) {
          map[r.parent_id].children.push(map[r.id]);
        } else if (!r.parent_id) {
          tree.push(map[r.id]);
        }
      });

      resolve(tree);
    });
  });
};


