# Uploads Table Implementation

## Overview
The file upload system now uses a dedicated `uploads` table to store detailed file metadata, while the `structure` table maintains the file hierarchy.

## Database Schema

### Uploads Table
```sql
CREATE TABLE uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,      -- Original filename from user
  stored_name VARCHAR(255) NOT NULL,        -- Unique filename on disk
  file_path VARCHAR(500) NOT NULL,          -- Full path to file
  file_size BIGINT NOT NULL,                -- File size in bytes
  mime_type VARCHAR(100),                   -- MIME type (e.g., image/png)
  parent_id INT NULL,                       -- Reference to parent folder in structure
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES structure(id) ON DELETE CASCADE
);
```

### Structure Table (Updated)
```sql
-- Existing columns plus:
file_path VARCHAR(500) NULL  -- Links to uploaded file
```

## How It Works

### Upload Process
1. User selects file via frontend
2. File uploaded to backend via multipart/form-data
3. Multer saves file to `backend/uploads/` with unique name
4. **Two database inserts happen:**
   - **uploads table**: Stores complete file metadata (size, mime type, etc.)
   - **structure table**: Creates file node in hierarchy with file_path reference

### Data Flow
```
Frontend Upload
    ↓
Multer Middleware (saves to disk)
    ↓
uploadService.saveUploadedFile()
    ↓
INSERT INTO uploads (metadata)
    ↓
INSERT INTO structure (hierarchy node)
    ↓
Return combined result
```

## API Endpoints

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data

Body:
  - file: File object
  - parent_id: (optional) Parent folder ID

Response:
{
  "id": 123,              // structure table ID
  "upload_id": 456,       // uploads table ID
  "name": "document.pdf",
  "type": "file",
  "parent_id": 10,
  "file_path": "uploads/document-1234567890.pdf",
  "file_size": 102400,
  "mime_type": "application/pdf",
  "created_at": "2026-02-09T..."
}
```

### Get All Uploads
```
GET /api/uploads

Response:
[
  {
    "id": 456,
    "original_name": "document.pdf",
    "stored_name": "document-1234567890.pdf",
    "file_path": "uploads/document-1234567890.pdf",
    "file_size": 102400,
    "mime_type": "application/pdf",
    "parent_id": 10,
    "created_at": "2026-02-09T...",
    "display_name": "document.pdf"
  }
]
```

### Download File
```
GET /api/download/:id

:id = structure table ID
Downloads file with original name
```

## Benefits of Separate Uploads Table

### ✅ Better Data Organization
- File metadata separate from hierarchy structure
- Easy to query all uploads regardless of location
- Can track upload statistics

### ✅ Enhanced Metadata
- File size tracking
- MIME type storage
- Original vs stored filename distinction
- Future: uploaded_by user tracking

### ✅ Improved Queries
```sql
-- Get all uploads by size
SELECT * FROM uploads ORDER BY file_size DESC;

-- Get uploads by type
SELECT * FROM uploads WHERE mime_type LIKE 'image/%';

-- Get total storage used
SELECT SUM(file_size) as total_bytes FROM uploads;

-- Get uploads with hierarchy info
SELECT u.*, s.name, s.parent_id 
FROM uploads u 
JOIN structure s ON u.file_path = s.file_path;
```

### ✅ Data Integrity
- Foreign key ensures parent folder exists
- Cascade delete removes upload when folder deleted
- Separate concerns: hierarchy vs file storage

## File Deletion

When a file node is deleted from structure table:
1. Database cascade deletes upload record
2. Backend service deletes physical file from disk
3. Both database and filesystem stay in sync

## Verification

### Check Uploads Table
```sql
SELECT * FROM uploads ORDER BY created_at DESC;
```

### Check Structure Files
```sql
SELECT * FROM structure WHERE type = 'file' AND file_path IS NOT NULL;
```

### Check Sync Between Tables
```sql
SELECT 
  s.id as structure_id,
  s.name,
  u.id as upload_id,
  u.file_size,
  u.mime_type
FROM structure s
LEFT JOIN uploads u ON s.file_path = u.file_path
WHERE s.type = 'file';
```

## Testing

Run verification script:
```bash
node backend/test-upload.js
```

Or check manually:
```bash
# Start backend
cd backend
npm run dev

# In another terminal, upload a file via frontend
# Then check database:
node -e "import db from './backend/config/db.js'; db.query('SELECT * FROM uploads', (e,r) => { console.table(r); process.exit(); });"
```

## Migration Status

✅ uploads table created
✅ Indexes added (parent_id, created_at)
✅ Foreign key constraint to structure table
✅ Upload service updated to use both tables
✅ Download service queries both tables
✅ New endpoint: GET /api/uploads

---

## New Permissions & Ownership Schema

In order to support shared folders and per-user permissions we added two
changes:

1. a new `owner_id` column on `structure` so every node can be attributed to a
   specific user, and
2. a new `permissions` table which holds explicit rights granted by a user to
   another on a particular node.

Run the following SQL after creating the uploads schema above:

```sql
-- add owner field to structure
ALTER TABLE structure
  ADD COLUMN owner_id INT NULL,
  ADD CONSTRAINT fk_structure_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- table to record sharing grants
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  user_id INT NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  granted_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES structure(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);
```

-- If you previously attempted to create the table and received an error about
-- `granted_by` being NOT NULL, drop the table or adjust it using:
--
-- ALTER TABLE permissions DROP FOREIGN KEY permissions_ibfk_3;
-- ALTER TABLE permissions MODIFY granted_by INT NULL;
-- ALTER TABLE permissions
--   ADD CONSTRAINT permissions_ibfk_3 FOREIGN KEY (granted_by)
--   REFERENCES users(id) ON DELETE SET NULL;


Existing structure rows will have `owner_id` NULL – you can update them to the
appropriate creator if you have that information. The `permissions` table is
used by the backend service to decide whether a user can view/edit/delete or
create children in a shared node.


## Files Modified

- `backend/migrations/create_uploads_table.sql` (NEW)
- `backend/migrations/runCreateUploadsTable.js` (NEW)
- `backend/services/uploadService.js` (UPDATED - dual insert)
- `backend/controllers/uploadController.js` (UPDATED - pass metadata)
- `backend/routes/uploadRoutes.js` (UPDATED - new endpoint)
- `backend/test-upload.js` (NEW)
- `backend/migrations/verify_setup.js` (UPDATED)

## Next Steps

1. ✅ Upload files via frontend
2. ✅ Verify data appears in uploads table
3. ✅ Test download functionality
4. ✅ Test delete (check both DB and filesystem)
5. Optional: Add user tracking (uploaded_by column)
6. Optional: Add file categories/tags
7. Optional: Add file versioning
