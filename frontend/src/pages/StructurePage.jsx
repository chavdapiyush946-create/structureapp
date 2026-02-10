import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStructure,
  fetchFolderChildren,
  createStructureNode,
  updateStructureNode,
  deleteStructureNode,
  clearError,
  uploadFile,
} from "../features/structure/structureSlice";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { toast } from "react-toastify";
import CustomIcon from "../components/CustomIcon";
import CustomTreeTable from "../components/CustomTreeTable";

const StructurePage = () => {
  const dispatch = useDispatch();
  const { tree, loading, error, loadingChildren, uploading } = useSelector((state) => state.structure);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [parentForNewNode, setParentForNewNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "folder",
    parent_id: null,
  });

  useEffect(() => {
    dispatch(fetchStructure());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "folder",
      parent_id: null,
    });
    setEditingNode(null);
    setParentForNewNode(null);    
  };

  const handleCreateNode = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const nodeData = {
      name: formData.name.trim(),
      type: formData.type,
      parent_id: formData.parent_id,
    };

    try {
      await dispatch(createStructureNode(nodeData)).unwrap();
      toast.success(`${formData.type === 'folder' ? 'Folder' : 'File'} created successfully!`);
      
      // Keep parent folder expanded after creating child
      if (formData.parent_id) {
        setExpandedNodes(prev => new Set([...prev, formData.parent_id]));
      }
      
      await dispatch(fetchStructure());
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error || 'Failed to create node');
    }
  };

  const handleUpdateNode = async () => {
    if (!formData.name.trim() || !editingNode) {
      toast.error("Name is required");
      return;
    }

    const updates = {
      name: formData.name.trim(),
    };

    try {
      await dispatch(updateStructureNode({ nodeId: editingNode.id, updates })).unwrap();
      toast.success(`${editingNode.type === 'folder' ? 'Folder' : 'File'} updated successfully!`);
      await dispatch(fetchStructure());
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error || 'Failed to update node');
    }
  };

  const handleDeleteNode = (node) => {
    confirmDialog({            
      message: `Are you sure you want to delete "${node.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await dispatch(deleteStructureNode(node.id)).unwrap();
          toast.success(`${node.type === 'folder' ? 'Folder' : 'File'} deleted successfully!`);
          await dispatch(fetchStructure());
          setSelectedNode(null);
        } catch (error) {
          toast.error(error || 'Failed to delete node');
        }
      }
    });
  };

  const openCreateDialog = (parentNode = null, type = 'folder') => {
    setParentForNewNode(parentNode);
    setFormData({
      name:"",
      type: type,
      parent_id: parentNode ? parentNode.id : null,
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = (node) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      type: node.type,
      parent_id: node.parent_id,
    });
    
    setShowEditDialog(true);
  }; 

  const handleFetchChildren = async (folderId) => {
    await dispatch(fetchFolderChildren(folderId));
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  const openUploadDialog = (parentNode = null) => {
    setParentForNewNode(parentNode);
    setSelectedFiles([]);
    setShowUploadDialog(true);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      if (parentForNewNode?.id) {
        formData.append('parent_id', parentForNewNode.id);
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/upload-multiple`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (result.failed > 0) {
        toast.warning(`${result.success} file(s) uploaded, ${result.failed} failed`);
      } else {
        toast.success(`${result.success} file(s) uploaded successfully!`);
      }
      
      if (parentForNewNode?.id) {
        setExpandedNodes(prev => new Set([...prev, parentForNewNode.id]));
      }
      
      await dispatch(fetchStructure());
      setShowUploadDialog(false);
      setSelectedFiles([]);
      setParentForNewNode(null);
    } catch (error) {
      toast.error(error.message || 'Failed to upload files');
    }
  };

  return (
    <div className="p-3">
      <ConfirmDialog />
      
      {/* Header Section */}
      <div className="mb-3">
        <div className="flex justify-content-between align-items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-900 m-0 mb-1">📁 File Structure Manager</h1>
            <p className="text-500 text-sm m-0">Organize your files and folders efficiently</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="New Folder"
              icon="pi pi-folder-plus"
              onClick={() => openCreateDialog(selectedNode, 'folder')}
              className="p-button-success"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Selected Node Info Bar */}
        {selectedNode && (
          <div className="surface-100 border-round p-2 border-1 surface-border">
            <div className="flex align-items-center justify-content-between">
              <div className="flex align-items-center gap-2">
                <div className="bg-primary-100 border-circle" style={{ padding: '0.4rem' }}>
                  <CustomIcon type={selectedNode.type} size={16} />
                </div>
                <div>
                  <div className="text-500" style={{ fontSize: '0.65rem', marginBottom: '0.15rem' }}>Selected</div>
                  <div className="font-bold text-900 text-sm">{selectedNode.name}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  label="Edit"
                  className="p-button-warning p-button-outlined p-button-sm"
                  onClick={() => openEditDialog(selectedNode)}                  
                  style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                />
                <Button
                  icon="pi pi-trash"
                  label="Delete"
                  className="p-button-danger p-button-outlined p-button-sm"
                  onClick={() => handleDeleteNode(selectedNode)}
                  style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="shadow-2 border-round-lg" style={{ border: 'none' }}>
        {error ? (
          <div className="text-center py-6">
            <div className="inline-flex align-items-center justify-content-center bg-red-100 border-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="pi pi-exclamation-triangle text-4xl text-red-500"></i>
            </div>
            <div className="text-900 font-bold text-xl mb-2">Error Loading Structure</div>
            <div className="text-600 mb-3">{error}</div>
            <Button
              label="Retry"
              icon="pi pi-refresh"
              onClick={() => dispatch(fetchStructure())}
              style={{ borderRadius: '8px' }}
            />
          </div>
        ) : (
          <CustomTreeTable
            data={tree}            
            loading={loading}
            loadingChildren={loadingChildren}
            onFetchChildren={handleFetchChildren}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
            onCreateFolder={(node) => openCreateDialog(node, 'folder')}
            onCreateFile={(node) => openCreateDialog(node, 'file')}
            onUploadFile={openUploadDialog}
            onEditNode={openEditDialog}
            onDeleteNode={handleDeleteNode}
            expandedNodes={expandedNodes}
            onExpandedNodesChange={setExpandedNodes}
          />
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog
        visible={showCreateDialog}
        onHide={() => {
          setShowCreateDialog(false);
          resetForm();
        }}
        header={
          <div className="flex align-items-center gap-3">
            <div className="bg-primary-100 border-circle p-2">
              <i className={`pi ${formData.type === 'folder' ? 'pi-folder-plus' : 'pi-file-plus'} text-primary text-xl`}></i>
            </div>
            <span className="text-2xl font-bold">Create New {formData.type === 'folder' ? 'Folder' : 'File'}</span>
          </div>
        }
        modal
        style={{ width: "500px" }}
        className="p-fluid"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateNode(); }}>
          <div className="flex flex-column gap-4 pt-3">
            <div className="field">
              <label className="font-semibold text-900 mb-2 block">Name *</label>
              <InputText
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Enter ${formData.type} name`}
                autoFocus
                className="p-inputtext-lg"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="field">
              <label className="font-semibold text-900 mb-2 block">Type</label>
              <Dropdown
                value={formData.type}
                options={[
                  { label: "📁 Folder", value: "folder" },
                  { label: "📄 File", value: "file" },
                ]}
                onChange={(e) => setFormData({ ...formData, type: e.value })}
                className="p-inputtext-lg"
                style={{ borderRadius: '8px' }}
              />
            </div>

            {parentForNewNode && (
              <div className="field">
                <label className="font-semibold text-900 mb-2 block">Parent Folder</label>
                <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg border-1 surface-border">
                  <CustomIcon type={parentForNewNode.type} size={20} />
                  <span className="font-medium text-900">{parentForNewNode.name}</span>
                </div>
              </div>
            )}

            <div className="flex justify-content-end gap-2 pt-3">
              <Button
                label="Cancel"
                type="button"
                className="p-button-text p-button-lg"                                
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                style={{ borderRadius:'8px'}}
              />
              <Button
                label="Create"
                type="submit"
                icon="pi pi-check"
                className="p-button-lg"
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}      
      <Dialog        
        visible={showEditDialog}        
        onHide={() => {
          setShowEditDialog(false);      
          resetForm();
        }}
                        
        header={
          <div className="flex align-items-center gap-3">
            <div className="bg-orange-100 border-circle p-2">
              <i className="pi pi-pencil text-orange-500 text-xl"></i>
            </div>
            <span className="text-2xl font-bold">Edit {editingNode?.type === 'folder' ? 'Folder' : 'File'}            
            </span>
          </div>
        }
        modal
        style={{ width: "500px" }}
        className="p-fluid"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateNode(); }}>
          <div className="flex flex-column gap-4 pt-3">
            <div className="field">
              <label className="font-semibold text-900 mb-2 block">Name *</label>
              <InputText
                
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
                autoFocus
                className="p-inputtext-lg"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="flex justify-content-end gap-2 pt-3">
              <Button
                label="Cancel"
                type="button"
                className="p-button-text p-button-lg"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
                style={{ borderRadius: '8px' }}
              />
              <Button
                label="Update"
                type="submit"
                icon="pi pi-check"
                className="p-button-warning p-button-lg"
                style={{ borderRadius:'8px'}}
                
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog
        visible={showUploadDialog}
        onHide={() => {
          setShowUploadDialog(false);
          setSelectedFiles([]);
          setParentForNewNode(null);
        }}
        header={
          <div className="flex align-items-center gap-3">
            <div className="bg-blue-100 border-circle p-2">
              <i className="pi pi-upload text-blue-500 text-xl"></i>
            </div>
            <span className="text-2xl font-bold">Upload Files</span>
          </div>
        }
        modal
        style={{ width: "500px" }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4 pt-3">
          <div className="field">
            <label className="font-semibold text-900 mb-2 block">Select Files *</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                width: '100%',
                fontSize: '1rem'
              }}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2">
                <div className="text-600 text-sm mb-2">
                  {selectedFiles.length} file(s) selected
                </div>
                <div className="flex flex-column gap-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="p-2 surface-100 border-round">
                      <div className="flex align-items-center justify-content-between gap-2">
                        <div className="flex align-items-center gap-2 flex-1" style={{ minWidth: 0 }}>
                          <i className="pi pi-file text-primary"></i>
                          <span className="text-sm font-medium" style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {file.name}
                          </span>
                        </div>
                        <div className="flex align-items-center gap-2">
                          <span className="text-xs text-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                          <Button
                            icon="pi pi-times"
                            className="p-button-rounded p-button-text p-button-danger p-button-sm"
                            onClick={() => {
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            style={{ width: '1.5rem', height: '1.5rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {parentForNewNode && (
            <div className="field">
              <label className="font-semibold text-900 mb-2 block">Upload to Folder</label>
              <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg border-1 surface-border">
                <CustomIcon type={parentForNewNode.type} size={20} />
                <span className="font-medium text-900">{parentForNewNode.name}</span>
              </div>
            </div>
          )}

          <div className="flex justify-content-end gap-2 pt-3">
            <Button
              label="Cancel"
              type="button"
              className="p-button-text p-button-lg"
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedFiles([]);
                setParentForNewNode(null);
              }}
              style={{ borderRadius: '8px' }}
            />
            <Button
              label={uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
              type="button"
              icon={uploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
              className="p-button-lg"
              onClick={handleFileUpload}
              disabled={selectedFiles.length === 0 || uploading}
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
export default StructurePage;
