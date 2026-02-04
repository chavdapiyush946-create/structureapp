-- Create STRUCTURE table for file/folder hierarchy
CREATE TABLE IF NOT EXISTS structure (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('file', 'folder') NOT NULL,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES structure(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_structure_parent ON structure(parent_id);
CREATE INDEX idx_structure_type ON structure(type);