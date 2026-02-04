import fs from 'fs';
import path from 'path';
import db from '../config/db.js';

const runStructureMigration = () => {
  return new Promise((resolve, reject) => {
    const migrationPath = path.join(process.cwd(), 'backend/migrations/create_structure_table.sql');
    
    fs.readFile(migrationPath, 'utf8', (err, sql) => {
      if (err) {
        console.error('Error reading migration file:', err);
        return reject(err);
      }

      db.query(sql, (err, result) => {
        if (err) {
          console.error('Error running migration:', err);
          return reject(err);
        }
        
        console.log('✅ Successfully created structure table');
        resolve(result);
      });
    });
  });
};

// Run migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runStructureMigration()
    .then(() => {
      console.log('Structure migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Structure migration failed:', error);
      process.exit(1);
    });
}

export default runStructureMigration;