import { useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import CustomIcon from "./CustomIcon";

const CustomTreeTable = ({ 
  data, 
  onCreateFolder, 
  onCreateFile, 
  onEditNode, 
  onDeleteNode,
  onFetchChildren, 
  loadingChildren = {}, // Track which folders are loading
  loading = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleExpansion = async (node) => {
    const nodeId = node.id;
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(nodeId)) {
      // Collapse
      newExpanded.delete(nodeId);
    } else {
      // Expand
      newExpanded.add(nodeId);
      
      // Lazy load children if not already loaded
      if (node.type === 'folder' && !node.childrenLoaded && onFetchChildren) {
        await onFetchChildren(nodeId);
      }
    }
    
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isLoadingChildren = loadingChildren[node.id];
    const indentStyle = { paddingLeft: `${level * 20}px` };

    return (
      <div key={node.id}>
        {/* Main Row */}
        <div className="custom-tree-row p-2 hover:surface-100">
          <div className="grid align-items-center">
            {/* Name Column */}
            <div className="col-6">
              <div className="flex align-items-center gap-2" style={indentStyle}>
                {/* Expand/Collapse Button */}
                {node.type === 'folder' ? (
                  <Button
                    icon={isLoadingChildren ? "pi pi-spin pi-spinner" : (isExpanded ? "pi pi-chevron-down" : "pi pi-chevron-right")}
                    className="p-button-text p-button-rounded p-button-sm"
                    onClick={() => toggleExpansion(node)}
                    disabled={isLoadingChildren}
                    style={{ minWidth: '2rem', height: '2rem' }}
                  />
                ) : (
                  <div style={{ width: '2rem' }}></div>
                )}
                
                {/* Icon and Name */}
                <CustomIcon type={node.type} size={18} />
                <span className="font-medium text-900">{node.name}</span>
                {isLoadingChildren && <span className="text-500 text-sm ml-2">(loading...)</span>}
              </div>
            </div>

            {/* Type Column */}
            <div className="col-2">
              <Tag 
                value={node.type} 
                severity={node.type === 'folder' ? 'warning' : 'info'}
                icon={node.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'}
              />
            </div>

            {/* Actions Column */}
            <div className="col-4">
              <div className="flex gap-1 justify-content-end">
                {node.type === 'folder' && (
                  <>
                    <Button
                      icon="pi pi-folder-plus"
                      className="p-button-rounded p-button-text p-button-success p-button-sm"
                      tooltip="Add Folder"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => onCreateFolder && onCreateFolder(node, 'folder')}
                    />
                    <Button
                      icon="pi pi-file-plus"
                      className="p-button-rounded p-button-text p-button-info p-button-sm"
                      tooltip="Add File"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => onCreateFile && onCreateFile(node, 'file')}
                    />
                  </>
                )}
                <Button
                  icon="pi pi-pencil"
                  className="p-button-rounded p-button-text p-button-warning p-button-sm"
                  tooltip="Edit"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => onEditNode && onEditNode(node)}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-text p-button-danger p-button-sm"
                  tooltip="Delete"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => onDeleteNode && onDeleteNode(node)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Children Rows */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="custom-tree-table">
        <div className="flex justify-content-center align-items-center p-8">
          <div className="text-center">
            <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <div>Loading structure...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="custom-tree-table">
        <div className="text-center p-8">
          <i className="pi pi-folder-open text-6xl text-400 mb-4"></i>
          <div className="text-900 font-medium text-xl mb-2">No structure yet</div>
          <div className="text-600 mb-4">Create your first folder or file to get started!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-tree-table">
      {/* Header */}
      <div className="custom-tree-header surface-100 border-bottom-1 surface-border p-3">
        <div className="grid font-semibold text-900">
          <div className="col-6">Name</div>
          <div className="col-2">Type</div>
          <div className="col-4 text-right">Actions</div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="custom-tree-content">
        {data.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
};

export default CustomTreeTable;
