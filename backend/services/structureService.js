import db from "../config/db.js";


export const createNode = ({ name, type, parent_id }) => {
  return new Promise((resolve, reject) => {
    // Validation
    if (!name || !type) {
      return reject(new Error("Name and type are required"));
    }
    if(name.length>255){
      return reject (new Error("name very long "))
    }

    if(name.trim()===""){
      return reject (new Error ("name cannot be empty "))
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

/* UPDATE NODE */
export const updateNode = (nodeId, updates) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM structure WHERE id = ?",
      [nodeId],
      (err, result) => {
        if (err) {
          console.error(err);
          return reject(new Error("Failed to find node"));
        }

        if (!result.length) {
          return reject(new Error("Node not found"));
        }

        const currentNode = result[0];

        const updateData = {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.type !== undefined && { type: updates.type }),

        };

        if (!Object.keys(updateData).length) {
          return resolve(currentNode);
        }

        if (updateData.name !== undefined && !updateData.name.trim()) {
          return reject(new Error("Name cannot be empty"));
        }

        if (
          updateData.type !== undefined &&
          !["file", "folder"].includes(updateData.type)
        ) {
          return reject(new Error("Type must be 'file' or 'folder'"));
        }

        const fields = Object.keys(updateData)
          .map((key) => `${key} = ?`)
          .join(", ");

        db.query(
          `UPDATE structure SET ${fields} WHERE id = ?`,
          [...Object.values(updateData), nodeId],
          (err) => {
            if (err) {
              console.error(err);
              return reject(new Error("Failed to update node"));
            }

            resolve({ ...currentNode, ...updateData });
          }
        );
      }
    );
  });
};


export const deleteNode = (nodeId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id, type FROM structure WHERE id = ?",
      [nodeId],
      (err, rows) => {
        if (err) {
          console.error(err);
          return reject(new Error("Failed to find node"));
        }

        if (!rows.length) {
          return reject(new Error("Node not found"));
        }

        const { type } = rows[0];

        if (type === "folder") {
          return checkFolderEmpty(nodeId)
            .then(() => performDelete(nodeId, resolve, reject))
            .catch(reject);
        }

        performDelete(nodeId, resolve, reject);
      }
    );
  });
};

const checkFolderEmpty = (nodeId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT COUNT(*) AS count FROM structure WHERE parent_id = ?",
      [nodeId],
      (err, rows) => {
        if (err) {
          console.error(err);
          return reject(new Error("Failed to check children"));
        }

        if (rows[0].count > 0) {
          return reject(
            new Error("Cannot delete folder with children. Delete children first.")
          );
        }

        resolve();
      }
    );
  });
};

const performDelete = (nodeId, resolve, reject) => {
  db.query(
    "DELETE FROM structure WHERE id = ?",
    [nodeId],
    (err, result) => {
      if (err) {
        console.error(err);
        return reject(new Error("Failed to delete node"));
      }

      if (!result.affectedRows) {
        return reject(new Error("Node not found"));
      }

      resolve({ message: "Node deleted successfully" });
    }
  );
};


