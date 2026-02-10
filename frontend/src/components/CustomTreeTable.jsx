import { useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import CustomIcon from "./CustomIcon";

const CustomTreeTable = ({ 
  data, 
  onCreateFolder, 
  onCreateFile, 
  onEditNode, 
  onDeleteNode,
  onFetchChildren,
  onUploadFile,
  loadingChildren = {},
  loading = false,
  expandedNodes: externalExpandedNodes,
  onExpandedNodesChange,
}) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const expandedNodes = externalExpandedNodes || internalExpandedNodes;
  const setExpandedNodes = onExpandedNodesChange || setInternalExpandedNodes;

  // Format date for display
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  const handleFileClick = async (node) => {
    if (node.type === 'file' && node.file_path) {
      setPreviewFile(node);
      setShowPreview(true);
      setFileContent('');
      
      // Load text content for text files
      const ext = node.name.split('.').pop().toLowerCase();
      const textExtensions = ['txt', 'log', 'md', 'json', 'xml', 'csv', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'h'];

      if (textExtensions.includes(ext)) {
        setLoadingContent(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/api/download/${node.id}`);          
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const text = await response.text();
          console.log('Loaded file content, length:', text.length);
          setFileContent(text);
        } catch (error) {
          console.error('Error loading file content:', error);
          setFileContent(`Error loading file content: ${error.message}`);
        } finally {
          setLoadingContent(false);
        }
      }
    }
  };

  // Get file URL
  const getFileUrl = (node) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}/api/download/${node.id}`;
  };

  // Check if file is previewable
  const isPreviewable = (node) => {
    if (!node.file_path) return false;
    const ext = node.name.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'pdf', 'txt', 'log', 'md', 'json', 'xml', 'csv', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'h'].includes(ext);
  };

  // Get file type icon
  const getFileIcon = (node) => {
    const ext = node.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'pi-image';
    if (['pdf'].includes(ext)) return 'pi-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'pi-file-word';
    if (['xls', 'xlsx'].includes(ext)) return 'pi-file-excel';
    if (['txt', 'log', 'md'].includes(ext)) return 'pi-file';
    if (['json', 'xml'].includes(ext)) return 'pi-code';
    if (['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'h'].includes(ext)) return 'pi-code';
    if (['zip', 'rar', '7z'].includes(ext)) return 'pi-box';
    return 'pi-file';
  };

  // Get syntax highlighting class
  const getSyntaxClass = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'language-javascript';
    if (['json'].includes(ext)) return 'language-json';
    if (['html'].includes(ext)) return 'language-html';
    if (['css'].includes(ext)) return 'language-css';
    if (['py'].includes(ext)) return 'language-python';
    if (['java'].includes(ext)) return 'language-java';
    if (['c', 'cpp', 'h'].includes(ext)) return 'language-c';
    if (['xml'].includes(ext)) return 'language-xml';
    if (['md'].includes(ext)) return 'language-markdown';
    return 'language-plaintext';
  };
  const toggleExpansion = async (node) => {
    const nodeId = node.id;
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      // Expand
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
        {/* Main Row */}
        <div 
          className="custom-tree-row py-1 px-2 hover:surface-100 transition-colors transition-duration-150"
          style={{ borderBottom: '1px solid #000000' }}
        >
          <div className="grid align-items-center">
            {/* Name Column - 40% */}
            <div className="col-5">
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
                  onClick={() => node.type === 'file' && handleFileClick(node)}
                >
                  {node.name}
                </span>
                {isLoadingChildren && <span className="text-500 text-xs ml-2">(loading...)</span>}
              </div>
            </div>

            {/* Type Column - 15% */}
            <div className="col-2">
              <Tag 
                value={node.type} 
                severity={node.type === 'folder' ? 'warning' : 'info'}
                icon={node.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              />
            </div>

            {/* Created Date Column - 25% */}
            <div className="col-3">
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
                    <Button
                      icon="pi pi-folder-plus"
                      className="p-button-rounded p-button-text p-button-success p-button-sm"
                      tooltip="Add Folder"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => onCreateFolder && onCreateFolder(node, 'folder')}
                      style={{ width: '1.75rem', height: '1.75rem' }}
                    />
                    <Button
                      icon="pi pi-upload"
                      className="p-button-rounded p-button-text p-button-info p-button-sm"
                      tooltip="Upload File"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => onUploadFile && onUploadFile(node)}
                      style={{ width: '1.75rem', height: '1.75rem' }}
                    />
                  </>
                ) : (
                  node.file_path && (
                    <Button
                      icon="pi pi-download"
                      className="p-button-rounded p-button-text p-button-help p-button-sm"
                      tooltip="Save File"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => {
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        window.open(`${apiUrl}/api/download/${node.id}`, '_blank');
                      }}
                      style={{ width: '1.75rem', height: '1.75rem' }}
                    />
                  )
                )}
                                
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-text p-button-danger p-button-sm"
                  tooltip="Delete"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => onDeleteNode && onDeleteNode(node)}
                  style={{ width: '1.75rem', height: '1.75rem' }}
                />
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
          <div className="col-5">Name</div>
          <div className="col-2">Type</div>
          <div className="col-3">Created Date</div>
          <div className="col-2 text-right">Actions</div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="custom-tree-content">
        {data.map(node => renderNode(node, 0))}
      </div>

      {/* File Preview Dialog */}
      <Dialog
        visible={showPreview}
        onHide={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
        header={
          <div className="flex align-items-center gap-3">
            <div className="bg-blue-100 border-circle p-2">
              <i className={`pi ${previewFile ? getFileIcon(previewFile) : 'pi-file'} text-blue-500 text-xl`}></i>
            </div>
            <span className="text-2xl font-bold">File Preview</span>
          </div>
        }
        modal
        style={{ width: "800px", maxWidth: "90vw" }}
        className="p-fluid"
      >
        {previewFile && (
          <div className="flex flex-column gap-3">
            {/* File Name Only */}
            <div className="flex align-items-center gap-2">
              <i className={`pi ${getFileIcon(previewFile)} text-2xl text-primary`}></i>
              <div className="font-bold text-xl text-900">{previewFile.name}</div>
            </div>

            {/* File Preview */}
            {isPreviewable(previewFile) && (
              <div className="border-1 surface-border border-round" style={{ maxHeight: '500px', overflow: 'auto' }}>
                {(() => {
                  const ext = previewFile.name.split('.').pop().toLowerCase();
                  const fileUrl = getFileUrl(previewFile);
                  
                  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
                    return (
                      <div className="text-center p-3">
                        <img 
                          src={fileUrl} 
                          alt={previewFile.name}
                          style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ display: 'none' }} className="text-500">
                          <i className="pi pi-exclamation-triangle text-4xl mb-3"></i>
                          <div>Unable to load image preview</div>
                        </div>
                      </div>
                    );
                  }
                  
                  if (ext === 'pdf') {
                    return (
                      <iframe
                        src={fileUrl}
                        style={{ width: '100%', height: '500px', border: 'none' }}
                        title={previewFile.name}
                      />
                    );
                  }
                  
                  if (['txt', 'log', 'md', 'json', 'xml', 'csv', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp', 'h'].includes(ext)) {
                    return (
                      <div>
                        {loadingContent ? (
                          <div className="text-center p-5">
                            <i className="pi pi-spin pi-spinner text-3xl text-primary mb-3"></i>
                            <div className="text-600">Loading...</div>
                          </div>
                        ) : fileContent ? (
                          <pre 
                            className={`text-sm font-mono m-0 ${getSyntaxClass(previewFile.name)}`}
                            style={{ 
                              whiteSpace: 'pre-wrap', 
                              wordBreak: 'break-word',
                              maxHeight: '500px',
                              overflow: 'auto',
                              padding: '1.5rem',
                              backgroundColor: '#f8f9fa',
                              margin: 0
                            }}
                          >
                            {fileContent}
                          </pre>
                        ) : (
                          <div className="text-center p-5 text-500">
                            <i className="pi pi-file text-4xl mb-3"></i>
                            <div>No content available</div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            )}

            {!isPreviewable(previewFile) && (
              <div className="text-center p-5 surface-50 border-round">
                <i className="pi pi-eye-slash text-5xl text-400 mb-3"></i>
                <div className="text-900 font-medium text-lg mb-2">Preview not available</div>
                <div className="text-600">This file type cannot be previewed</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-content-end gap-2 pt-2">
              <Button
                label="Close"
                icon="pi pi-times"
                className="p-button-text p-button-lg"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewFile(null);
                }}
                style={{ borderRadius: '8px' }}
              />
              <Button
                label="Download"
                icon="pi pi-download"
                className="p-button-lg"
                onClick={() => window.open(getFileUrl(previewFile), '_blank')}
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default CustomTreeTable;
