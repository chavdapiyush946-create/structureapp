import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStructure,
  fetchFolderChildren,
  createStructureNode,
  updateStructureNode,
  deleteStructureNode,
  clearError,
  setTree,
  uploadFile,
} from "../features/structure/structureSlice";
import {
  fetchUsers,
  grantPermission,
  clearPermissionError,
  fetchFolderUsers,
} from "../features/structure/permissionSlice";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { toast } from "react-toastify";
import CustomIcon from "../components/CustomIcon";
import CustomTreeTable from "../components/CustomTreeTable";
import api from "../services/api";

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
  const [creatingNode, setCreatingNode] = useState(false);
  const fileInputRef = useRef(null);

  // permission dialog state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState({});

  const { users, folderUsers, folderUsersLoading } = useSelector((state) => state.permissions);
  const currentUserId = useSelector((state) => state.auth.id);

  const [formData, setFormData] = useState({
    name: "",
    type: "folder",
    parent_id: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // fetch users first so owner lookups work when structure loads
        await dispatch(fetchUsers()).unwrap();
      } catch (err) {
        // ignore - will still try to load structure
      }
      dispatch(fetchStructure());
    };
    init();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const permError = useSelector((state) => state.permissions.error);
  useEffect(() => {
    if (permError) {
      toast.error(permError);
      dispatch(clearPermissionError());
    }
  }, [permError, dispatch]);

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

    // Prevent duplicate submissions
    if (creatingNode) {
      return;
    }

    setCreatingNode(true);

    // If type is "file" and a file is selected, upload it instead
    if (formData.type === 'file' && selectedFiles.length > 0) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('files', selectedFiles[0]);
        
        // Ensure custom name has file extension
        let customName = formData.name.trim();
        const originalExt = selectedFiles[0].name.split('.').pop();
        if (originalExt && !customName.endsWith(`.${originalExt}`)) {
          customName = `${customName}.${originalExt}`;
        }
        
        formDataUpload.append('customName', customName);
        if (formData.parent_id) {
          formDataUpload.append('parent_id', formData.parent_id);
        }

        const { data: result } = await api.post("/upload-multiple", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (result.success > 0) {
          toast.success('File uploaded successfully!');
          if (formData.parent_id) {
            setExpandedNodes(prev => new Set([...prev, formData.parent_id]));
          }
          await dispatch(fetchStructure());
          setShowCreateDialog(false);
          setSelectedFiles([]);
          resetForm();
        } else {
          toast.error('Failed to upload file');
        }
      } catch (error) {
        console.error('upload error', error);
        const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to upload file';
        toast.error(msg);
      } finally {
        setCreatingNode(false);
      }
      return;
    }

    const nodeData = {
      name: formData.name.trim(),
      type: formData.type,
      parent_id: formData.parent_id,
    };

    try {
      // create and get created node back
      const created = await dispatch(createStructureNode(nodeData)).unwrap();
      toast.success(`${formData.type === 'folder' ? 'Folder' : 'File'} created successfully!`);

      // Keep parent folder expanded after creating child
      if (formData.parent_id) {
        setExpandedNodes(prev => new Set([...prev, formData.parent_id]));
      }

      // Refresh the structure and then ensure the newly created node appears at the top
      const newTree = await dispatch(fetchStructure()).unwrap();

      // Helper to place created node at the start of its parent's children (or root)
      const placeAtTop = (nodes) => {
        // if root
        if (!created.parent_id) {
          // move created node to front of root level
          const idx = nodes.findIndex(n => n.id === created.id);
          if (idx > 0) {
            // Found but not at front - move to front
            const copy = [...nodes];
            const [node] = copy.splice(idx, 1);
            copy.unshift(node);
            return copy;
          } else if (idx === 0) {
            // Already at front
            return nodes;
          } else {
            // Not found in tree (idx === -1) - add it to the front
            return [created, ...nodes];
          }
        }

        // For child folders: update parent's children AND ensure parent stays at top
        const update = (arr) => {
          return arr.map(n => {
            if (n.id === created.parent_id) {
              // Initialize or get children array
              let children = n.children ? [...n.children] : [];
              
              // Find the created child in the fetched tree data
              const fetchedChild = children.find(c => c.id === created.id);
              
              // Remove any existing child with the same ID (prevent duplicates)
              children = children.filter(c => c.id !== created.id);
              
              // Add the child to the front (use fetched data if available, otherwise use created)
              const childToAdd = fetchedChild || created;
              children.unshift(childToAdd);
              
              return { ...n, children, childrenLoaded: true };
            }
            if (n.children) {
              return { ...n, children: update(n.children) };
            }
            return n;
          });
        };

        let result = update(nodes);
        
        // After updating child, ensure the parent folder stays at top of root
        // Find the parent folder at root level and move it to front
        const parentIdx = result.findIndex(n => n.id === created.parent_id);
        if (parentIdx > 0) {
          // Parent found but not at front - move it to front to keep it visible
          const copy = [...result];
          const [parent] = copy.splice(parentIdx, 1);
          copy.unshift(parent);
          return copy;
        }
        
        return result;
      };

      const reordered = placeAtTop(newTree);
      // set tree in store
      dispatch(setTree(reordered));

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error || 'Failed to create node');
    } finally {
      setCreatingNode(false);
    }
  };

  const handleUpdateNode = async () => {

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
      console.log(error);

      // toast.error(error || 'Failed to update node');
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
          console.log(error);

          // toast.error(error || 'Failed to delete node');
        }
      }
    });
  };

  const openCreateDialog = (parentNode = null, type = 'folder') => {
    setParentForNewNode(parentNode);
    setFormData({
      name: "",
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

  const openPermissionDialog = async (node) => {
    setSelectedNode(node);
    setPermissionChanges({});
    await dispatch(fetchFolderUsers(node.id));
    setShowPermissionDialog(true);
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

      // use axios instance which handles auth
      const { data: result } = await api.post(
        "/upload-multiple",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (result.failed > 0) {
        toast.warning(`${result.success} file(s) uploaded, ${result.failed} failed`);
      } else {
        toast.success(`${result.success} file(s) uploaded successfully!`);
      }

      if (parentForNewNode?.id) {
        setExpandedNodes(prev => new Set([...prev, parentForNewNode.id]));
      }

      // Fetch users first to ensure owner lookups work
      try {
        await dispatch(fetchUsers()).unwrap();
      } catch (err) {
        // ignore if users fetch fails, continue with structure fetch
      }

      await dispatch(fetchStructure());
      setShowUploadDialog(false);
      setSelectedFiles([]);
      setParentForNewNode(null);
    } catch (error) {
      console.error('upload error', error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to upload files';
      toast.error(msg);
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
              
              icon="pi pi-refresh"
              onClick={() => dispatch(fetchStructure())}
              className="p-button-secondary"
              style={{ borderRadius: '8px' }}
            />
            <Button
              label="New Folder"
              icon="pi pi-folder-plus"
              onClick={() => openCreateDialog(selectedNode, 'folder')}
              className="p-button-success"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>

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
            currentUserId={currentUserId}
            users={users}
            onFetchChildren={handleFetchChildren}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
            onCreateFolder={(node) => openCreateDialog(node, 'folder')}
            onCreateFile={(node) => openCreateDialog(node, 'file')}
            onUploadFile={openUploadDialog}
            onEditNode={openEditDialog}
            onDeleteNode={handleDeleteNode}
            onManagePermissions={openPermissionDialog}
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

            {/* Show file upload when type is "file" */}
            {formData.type === 'file' && (
              <div className="field">
                <label className="font-semibold text-900 mb-2 block">Upload File (Optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFiles([file]);
                      // Auto-fill name from filename if empty
                      if (!formData.name) {
                        setFormData({ ...formData, name: file.name });
                      }
                    }
                  }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 p-2 surface-100 border-round">
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-file text-primary"></i>
                      <span className="text-sm font-medium">{selectedFiles[0].name}</span>
                      <span className="text-xs text-500 ml-auto">
                        {(selectedFiles[0].size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                disabled={creatingNode}
                style={{ borderRadius: '8px' }}
              />
              <Button
                label="Create"
                type="submit"
                icon="pi pi-check"
                className="p-button-lg"
                loading={creatingNode}
                disabled={creatingNode}
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
                style={{ borderRadius: '8px' }}

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

      {/* Permission Dialog */}
      <Dialog
        visible={showPermissionDialog}
        onHide={() => {
          setShowPermissionDialog(false);
          setPermissionChanges({});
        }}
        header={
          <div className="flex align-items-center gap-3">
            <div className="bg-secondary-100 border-circle p-2">
              <i className="pi pi-key text-secondary text-xl"></i>
            </div>
            <span className="text-2xl font-bold">Manage Permissions</span>
          </div>
        }
        modal
        style={{ width: "900px", maxWidth: '90vw' }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4 pt-3">
          {folderUsersLoading ? (
            <div className="flex justify-content-center align-items-center" style={{ height: '300px' }}>
              <i className="pi pi-spin pi-spinner text-2xl"></i>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>View</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Edit</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Delete</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Create</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Upload</th>
                  </tr>
                </thead>
                <tbody>
                  {folderUsers.map((user) => {
                    const isCurrentUser = currentUserId && user.id === currentUserId;
                    const rowBg = isCurrentUser ? '#f5f5f5' : (permissionChanges[user.id] ? '#fff3cd' : 'transparent');
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: rowBg, opacity: isCurrentUser ? 0.85 : 1 }}>
                        <td style={{ padding: '12px' }}>
                          <div className="flex flex-column" style={isCurrentUser ? { pointerEvents: 'none' } : {}}>
                            <span className="font-semibold">{user.name}</span>
                            <span className="text-sm text-600">{user.email}</span>
                          </div>
                        </td>
                        {['can_view', 'can_edit', 'can_delete', 'can_create', 'can_upload'].map((perm) => (
                          <td key={`${user.id}-${perm}`} style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              id={`${user.id}-${perm}`}
                              checked={isCurrentUser ? true : (permissionChanges[user.id]?.[perm] ?? user[perm] ?? false)}
                              disabled={isCurrentUser}
                              onChange={(e) => {
                                if (isCurrentUser) return;
                                setPermissionChanges({
                                  ...permissionChanges,
                                  [user.id]: {
                                    ...(permissionChanges[user.id] || {}),
                                    [perm]: e.target.checked,
                                  }
                                });
                              }}
                              style={{ width: '18px', height: '18px', cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-content-end gap-2 pt-3">
            <Button
              label="Cancel"
              type="button"
              className="p-button-text p-button-lg"
              onClick={() => {
                setShowPermissionDialog(false);
                setPermissionChanges({});
              }}
              style={{ borderRadius: '8px' }}
            />
            <Button
              label="Save Changes"
              icon="pi pi-check"
              className="p-button-lg"
              loading={useSelector(state => state.permissions.granting)}
              onClick={async () => {
                try {
                  let savedCount = 0;
                  // Save all permission changes
                  for (const userId in permissionChanges) {
                    // Skip saving changes for the currently logged-in user
                    if (parseInt(userId) === currentUserId) continue;
                    const originalUser = folderUsers.find(u => u.id === parseInt(userId));
                    if (originalUser) {
                      // Check if any actual changes were made for this user
                      const permsChanged = permissionChanges[userId];
                      const hasActualChanges = Object.keys(permsChanged).some(
                        perm => permsChanged[perm] !== (originalUser[perm] ?? false)
                      );

                      if (hasActualChanges) {
                        // Merge original permissions with changes to create complete perms object
                        const completePerms = {
                          can_view: permsChanged.can_view !== undefined ? permsChanged.can_view : (originalUser.can_view ?? false),
                          can_edit: permsChanged.can_edit !== undefined ? permsChanged.can_edit : (originalUser.can_edit ?? false),
                          can_delete: permsChanged.can_delete !== undefined ? permsChanged.can_delete : (originalUser.can_delete ?? false),
                          can_create: permsChanged.can_create !== undefined ? permsChanged.can_create : (originalUser.can_create ?? false),
                          can_upload: permsChanged.can_upload !== undefined ? permsChanged.can_upload : (originalUser.can_upload ?? false),
                        };

                        await dispatch(grantPermission({
                          folder_id: selectedNode.id,
                          user_id: parseInt(userId),
                          ...completePerms,
                        })).unwrap();
                        savedCount++;
                      }
                    }
                  }

                  if (savedCount > 0) {
                    toast.success(`Permissions updated for ${savedCount} user(s)`);
                  } else {
                    toast.info('No changes to save');
                  }
                  
                  setShowPermissionDialog(false);
                  setPermissionChanges({});
                  // Refresh folder users
                  await dispatch(fetchFolderUsers(selectedNode.id));
                  // Refresh the tree to show updated permissions
                  await dispatch(fetchStructure());
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to update permissions');
                }
              }}
              style={{ borderRadius: '8px' }}
              disabled={Object.keys(permissionChanges).length === 0}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
export default StructurePage;
