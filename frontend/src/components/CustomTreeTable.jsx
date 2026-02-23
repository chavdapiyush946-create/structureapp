import { useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import CustomIcon from "./CustomIcon";
import FilePreview, { isPreviewable, downloadWithAuth } from "./FilePreview";

const CustomTreeTable = ({ 
  data, 
  currentUserId,
  onCreateFolder, 
  onCreateFile, 
  onEditNode, 
  onDeleteNode,
  onManagePermissions,
  onFetchChildren,
  onUploadFile,
  loadingChildren = {},
  loading = false,
  expandedNodes: externalExpandedNodes,
  onExpandedNodesChange,
  users = [],
}) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState(new Set());
  const [previewNode, setPreviewNode] = useState(null);
  
  const expandedNodes = externalExpandedNodes || internalExpandedNodes;
  const setExpandedNodes = onExpandedNodesChange || setInternalExpandedNodes;

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      return 'Error';
    }
  };


  const openPreview = (node) => {
    if (node.type === 'file' && node.file_path) {
      setPreviewNode(node);
    }
  };

  const toggleExpansion = async (node) => {
    const nodeId = node.id;
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
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
    const indentStyle = { paddingLeft: `${level * 16}px` };
    const isFolder = node.type === 'folder';
    const isEmpty = isFolder && isExpanded && !hasChildren && !isLoadingChildren && node.childrenLoaded;

    return (
      <div key={node.id}>
        <div 
          className="custom-tree-row py-1 px-2 hover:surface-100 transition-colors transition-duration-150"
          style={{ borderBottom: '1px solid #000000' }}          
        >
          <div className="grid align-items-center">
            {/* Name Column - 33% */}
            <div className="col-4">
              <div className="flex align-items-center gap-2" style={indentStyle}>
                {/* Expand/Collapse Button */}
                {isFolder ? (
                  <Button
                    icon={isLoadingChildren ? "pi pi-spin pi-spinner" : (isExpanded ? "pi pi-chevron-down" : "pi pi-chevron-right")}
                    className="p-button-text p-button-rounded p-button-sm"
                    onClick={() => toggleExpansion(node)}                  
                    disabled={isLoadingChildren}
                    style={{ minWidth: '1.5rem', height: '1.5rem', padding: '0.25rem' }}
                  />
                ) : (
                  <div style={{ width: '1.5rem' }}></div>
                )}
                                
                <CustomIcon type={node.type} size={14} />
                <span 
                  className="font-medium text-900 text-sm"
                  style={{ cursor: node.type === 'file' && node.file_path ? 'pointer' : 'default' }}
                  onClick={() => node.type === 'file' && openPreview(node)}
                >
                  {node.name}
                </span>
                {isLoadingChildren && <span className="text-500 text-xs ml-2">(loading...)</span>}
              </div>
            </div>

            {/* Type Column - 17% */}
            <div className="col-2">
              <Tag 
                value={node.type} 
                severity={node.type === 'folder' ? 'warning' : 'info'}
                icon={node.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              />
            </div>

            {/* Created By Column - 17% */}
            <div className="col-2">
              <div className="flex align-items-center gap-1 text-600 text-sm">
                <i className="pi pi-user text-xs"></i>
                <span>{
                  node.owner_name ||
                  users.find(u => u.id === node.owner_id)?.name ||
                  'Unknown'
                }</span>
              </div>
            </div>

            {/* Created Date Column - 17% */}
            <div className="col-2">
              <div className="flex align-items-center gap-1 text-600 text-sm">
                <i className="pi pi-calendar text-xs"></i>
                <span>{formatDate(node.created_at)}</span>
              </div>
            </div>            

            {/* Actions Column - 20% */}
            <div className="col-2">
              <div className="flex gap-1 justify-content-end">
                {isFolder ? (
                  <>
                    {/* permission button visible only if current user is owner AND it's a root folder (no parent) */}
                    {currentUserId && node.owner_id === currentUserId && !node.parent_id && onManagePermissions && (
                      <Button
                        icon="pi pi-key"
                        className="p-button-rounded p-button-text p-button-secondary p-button-sm"
                        tooltip="Manage Permissions"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => onManagePermissions(node)}
                        style={{ width: '1.75rem', height: '1.75rem' }}
                      />
                    )}
                    {(node.can_create || (currentUserId && node.owner_id === currentUserId)) && (
                      <Button
                        icon="pi pi-folder-plus"
                        className="p-button-rounded p-button-text p-button-success p-button-sm"
                        tooltip="Add Folder"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => onCreateFolder && onCreateFolder(node, 'folder')}
                        style={{ width: '1.75rem', height: '1.75rem' }}
                      />
                    )}
                    {(node.can_upload || (currentUserId && node.owner_id === currentUserId)) && (
                      <Button
                        icon="pi pi-upload"
                        className="p-button-rounded p-button-text p-button-info p-button-sm"
                        tooltip="Upload File"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => onUploadFile && onUploadFile(node)}
                        style={{ width: '1.75rem', height: '1.75rem' }}
                      />
                    )}
                  </>
                ) : (
                  node.file_path && (
                    <>
                      {isPreviewable(node) && (
                        <Button
                          icon="pi pi-eye"
                          className="p-button-rounded p-button-text p-button-secondary p-button-sm"
                          tooltip="Preview File"
                          tooltipOptions={{ position: 'top' }}
                          onClick={() => openPreview(node)}
                          style={{ width: '1.75rem', height: '1.75rem' }}
                        />
                      )}
                      <Button
                        icon="pi pi-download"
                        className="p-button-rounded p-button-text p-button-help p-button-sm"
                        tooltip="Save File"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => downloadWithAuth(node)}
                        style={{ width: '1.75rem', height: '1.75rem' }}
                      />
                    </>
                  )
                )}
                                
                {/* edit button - show if user has edit permission or owns the item */}
                {onEditNode && (node.can_edit || (currentUserId && node.owner_id === currentUserId)) && (
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-warning p-button-sm"
                    tooltip="Edit"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => onEditNode && onEditNode(node)}
                    style={{ width: '1.75rem', height: '1.75rem' }}
                  />
                )}

                {/* delete button - show if user has delete permission or owns the item */}
                {onDeleteNode && (node.can_delete || (currentUserId && node.owner_id === currentUserId)) && (
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    tooltip="Delete"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => onDeleteNode && onDeleteNode(node)}
                    style={{ width: '1.75rem', height: '1.75rem' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Empty Folder Message */}
        {isEmpty && (
          <div style={{ paddingLeft: `${(level + 1) * 16 + 32}px`, borderBottom: '1px solid #000000' }} className="py-2">
            <div className="flex align-items-center gap-3 text-500 text-sm surface-50 border-round p-2 border-1 border-dashed surface-border">
              <i className="pi pi-inbox text-lg"></i>
              <span className="flex-grow-1">This folder is empty</span>
            </div>
          </div>
        )}

        {/* Children Rows */}
        {hasChildren && isExpanded && (
          <>
            {node.children.map(child => renderNode(child, level + 1))}
          </>
        )}
      </div>
    );
  };

  // preview handling moved to FilePreview component
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
          <div className="flex gap-2 justify-content-center">
            <Button
              label="Create Folder"
              icon="pi pi-folder-plus"
              className="p-button-success"
              onClick={() => onCreateFolder && onCreateFolder(null, 'folder')}
            />
                                    
            <Button
              label="Upload File"
              icon="pi pi-upload"
              className="p-button-info"
              onClick={() => onUploadFile && onUploadFile(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-tree-table">
      {/* Header */}
      <div className="custom-tree-header surface-100 border-bottom-2 surface-border py-2 px-2">
        <div className="grid font-semibold text-900 text-sm">
          <div className="col-4">Name</div>
          <div className="col-2">Type</div>
          <div className="col-2">Created By</div>
          <div className="col-2">Created Date</div>
          <div className="col-2 text-right">Actions</div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="custom-tree-content">
        {data.map(node => renderNode(node, 0))}
      </div>

      {/* File preview moved to FilePreview component */}
      <FilePreview node={previewNode} visible={!!previewNode} onHide={() => setPreviewNode(null)} />
    </div>
  );
}


export default CustomTreeTable;

