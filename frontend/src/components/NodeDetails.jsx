import { Button } from "primereact/button"
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import CustomIcon from "./CustomIcon";

const NodeDetails = ({ node, onCreateFolder, onCreateFile, onEditNode, onDeleteNode }) => {
  if (!node) {
    return (
      <div className="text-center py-8">
        <i className="pi pi-info-circle text-6xl text-400 mb-4"></i>
        <div className="text-900 font-medium text-xl mb-2">No Selection</div>
        <div className="text-600">Select a file or folder to view details</div>
      </div>
    );
  }

  const getFileSize = (node) => {
    // Mock file size for demonstration
    if (node.type === 'file') {
      const sizes = ['1.2 KB', '45.6 KB', '2.3 MB', '156 KB', '8.9 MB'];
      return sizes[Math.floor(Math.random() * sizes.length)];
    }
    return null;
  };

  const getChildrenCount = (node) => {
    if (node.type === 'folder' && node.children) {
      const folders = node.children.filter(child => child.type === 'folder').length;
      const files = node.children.filter(child => child.type === 'file').length;
      return { folders, files, total: folders + files };
    }
    return null;
    
  };

  

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const childrenCount = getChildrenCount(node);
  const fileSize = getFileSize(node);

  return (
    <div className="p-4  overflow-auto">
      {/* Header */}
      <div className="flex align-items-center gap-3 mb-4">
        <CustomIcon type={node.type} size={32} className="text-600" />
        <div>
          <h3 className="text-xl font-bold m-0 text-900">{node.name}</h3>
          <Tag 
            value={node.type} 
            severity={node.type === 'folder' ? 'warning' : 'info'}
            className="mt-1"
          />
        </div>
      </div>

      <Divider />

      {/* Properties */}
      <div className="grid">
        <div className="col-12">
          <div className="surface-50 border-round ">
            <h4 className="text-900 font-semibold ">Properties</h4>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-600">ID:</span>
              <span className="font-medium">{node.id}</span>
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-600">Name:</span>
              <span className="font-medium">{node.name}</span>
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-600">Type:</span>
              <Tag 
                value={node.type} 
                severity={node.type === 'folder' ? 'warning' : 'info'}
                size="small"
              />
            </div>
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-600">Parent ID:</span>
              <span className="font-medium">{node.parent_id || 'Root'}</span>
            </div>
            
            {fileSize && (
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-600">Size:</span>
                <span className="font-medium">{fileSize}</span>
              </div>
            )}
            
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-600">Created:</span>
              <span className="font-medium">
                {formatDate(node.created_at)}
              </span>
            </div>
          </div>
        </div>

        
        {node.type === 'folder' && (
          <div className="col-12">
            <div className="surface-50 border-round ">
              <h4 className="text-900 font-semibold mb-3">Contents</h4>
              
              {childrenCount && childrenCount.total > 0 ? (
                <>
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="text-600">Total Items:</span>
                    <Tag value={childrenCount.total} severity="info" />
                  </div>
                  
                  
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="text-600">Files:</span>
                    <Tag value={childrenCount.files} severity="success" />
                  </div>
                </>
              ) : (
                <div className="text-center py-3 text-500">
                  <i className="pi pi-inbox text-2xl mb-2"></i>
                  <div>Empty folder</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="col-12">
          <div className="surface-50 border-round p-3">
            <h4 className="text-900 font-semibold mb-3">Actions</h4>
            
            <div className="flex flex-column gap-2">
              {node.type === 'folder' && (
                <>
                  <Button
                    label="Add new"
                    className="p-button-success p-button-sm"
                    onClick={() => onCreateFolder(node)}
                  />
                 
                </>
              )}
              
              <Button
                label="Edit"
                className="p-button-warning p-button-sm"
                onClick={() => onEditNode(node)}
              />
              
              <Button
                label="Delete"
                className="p-button-danger p-button-sm"
                onClick={() => onDeleteNode(node)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;