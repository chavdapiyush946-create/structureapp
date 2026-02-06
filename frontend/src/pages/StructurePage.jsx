import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStructure,
  fetchFolderChildren,
  createStructureNode,
  updateStructureNode,
  deleteStructureNode,
  clearError,
} from "../features/structure/structureSlice";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toolbar } from "primereact/toolbar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";

import CustomIcon from "../components/CustomIcon";
import CustomTreeTable from "../components/CustomTreeTable";

const StructurePage = () => {
  const dispatch = useDispatch();
  const { tree, loading, error, loadingChildren } = useSelector((state) => state.structure);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [parentForNewNode, setParentForNewNode] = useState(null);

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

  const handleCreateNode = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const nodeData = {
      name: formData.name.trim(),
      type: formData.type,
      parent_id: formData.parent_id,
    };

    dispatch(createStructureNode(nodeData)).then((result) => {
      if (result.type === "structure/createNode/fulfilled") {
        toast.success(`${formData.type === 'folder' ? 'Folder' : 'File'} created successfully!`);
        dispatch(fetchStructure());
        setShowCreateDialog(false);
        resetForm();
      }
    });
  };

  const handleUpdateNode = () => {
    if (!formData.name.trim() || !editingNode) {
      toast.error("Name is required");
      return;
    }

    const updates = {
      name: formData.name.trim(),
    };

    dispatch(updateStructureNode({ nodeId: editingNode.id, updates })).then((result) => {
      if (result.type === "structure/updateNode/fulfilled") {
        toast.success(`${editingNode.type === 'folder' ? 'Folder' : 'File'} updated successfully!`);
        dispatch(fetchStructure());
        setShowEditDialog(false);
        resetForm();
      }
    });
  };

  const handleDeleteNode = (node) => {
    confirmDialog({      
      message: `Are you sure you want to delete "${node.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        dispatch(deleteStructureNode(node.id)).then((result) => {
          if (result.type === "structure/deleteNode/fulfilled") {
            toast.success(`${node.type === 'folder' ? 'Folder' : 'File'} deleted successfully!`);
            dispatch(fetchStructure());
          }
        });
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

  const toolbarStartContent = (
    <div className="flex gap-2">
      <Button
        label="New Folder"
        icon="pi pi-folder-plus"
        className="p-button-success"
        onClick={() => openCreateDialog(null, 'folder')}
      />
     
    </div>
  );

  return (
    <div className="p-4">
      <ConfirmDialog />
      
      <Card title="📁 File Structure Manager" className="mb-4">
        <Toolbar start={toolbarStartContent} className="mb-4" />
        
        {error ? (
          <div className="text-center py-8">
            <i className="pi pi-exclamation-triangle text-6xl text-red-400 mb-4"></i>
            <div className="text-900 font-medium text-xl mb-2">Error Loading Structure</div>
            <div className="text-600 mb-4">{error}</div>
          </div>
        ) : (
          <CustomTreeTable
            data={tree}            
            loading={loading}
            loadingChildren={loadingChildren}
            onFetchChildren={handleFetchChildren}
            onCreateFolder={(node) => openCreateDialog(node, 'folder')}
            onCreateFile={(node) => openCreateDialog(node, 'file')}
            onEditNode={openEditDialog}
            onDeleteNode={handleDeleteNode}
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
        header={`Create New ${formData.type === 'folder' ? 'Folder' : 'File'}`}
        modal
        style={{ width: "400px" }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4">
          <div className="field">
            <label>Name *</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Enter ${formData.type} name`}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Type</label>
            <Dropdown
              value={formData.type}
              options={[
                { label: "Folder", value: "folder" },
                { label: "File", value: "file" },
              ]}
              onChange={(e) => setFormData({ ...formData, type: e.value })}
            />
          </div>

          {parentForNewNode && (
            <div className="field">
              <label>Parent</label>
              <div className="flex align-items-center gap-2 p-2 surface-100 border-round">
                <CustomIcon type={parentForNewNode.type} size={16} />
                <span>{parentForNewNode.name}</span>
              </div>
            </div>
          )}

          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
            <Button
              label="Create"
              icon="pi pi-check"
              onClick={handleCreateNode}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        visible={showEditDialog}
        onHide={() => {
          setShowEditDialog(false);
          resetForm();
        }}
        header={`Edit ${editingNode?.type === 'folder' ? 'Folder' : 'File'}`}
        modal
        style={{ width: "400px" }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4">
          <div className="field">
            <label>Name *</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              autoFocus
            />
          </div>

          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            />
            <Button
              label="Update"
              icon="pi pi-check"
              onClick={handleUpdateNode}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default StructurePage;