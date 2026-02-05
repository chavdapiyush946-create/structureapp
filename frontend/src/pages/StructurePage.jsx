import { use, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStructure,
  createStructureNode,
  updateStructureNode,
  deleteStructureNode,
  setSelectedNode,
  clearError,
} from "../features/structure/structureSlice";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tree } from "primereact/tree";
import { Toolbar } from "primereact/toolbar";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { Panel } from "primereact/panel";
import { Badge } from "primereact/badge";
import { ConfirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";

import StructureTree from "../components/StructureTree";
import NodeDetails from "../components/NodeDetails";
import CreateNodeDialog from "../components/CreateNodeDialog";
import EditNodeDialog from "../components/EditNodeDialog";
import CustomIcon from "../components/CustomIcon";


const StructurePage = () => {
  const dispatch = useDispatch();
  const { tree, loading, error, selectedNode } = useSelector((state) => state.structure);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [parentForNewNode, setParentForNewNode] = useState(null);
  const [nodeToEdit, setNodeToEdit] = useState(null);


  useEffect(() => {
    dispatch(fetchStructure());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateNode = (nodeData) => {
    dispatch(createStructureNode(nodeData)).then((result) => {
      if (result.type === "structure/createNode/fulfilled") {
        toast.success(`${nodeData.type === 'folder' ? 'Folder' : 'File'} created successfully!`);
        dispatch(fetchStructure()); // Refresh tree
        setShowCreateDialog(false);
        setParentForNewNode(null);
      }
    });
  };

  const handleCreateFolder = (parentNode = null) => {
    setParentForNewNode(parentNode);
    setShowCreateDialog(true);
  };

  const handleCreateFile = (parentNode) => {
    if (!parentNode || parentNode.type !== 'folder') {
      toast.error("Files must be created inside a folder");
      return;
    }
    setParentForNewNode(parentNode);
    setShowCreateDialog(true);
  };

  const handleEditNode = (node) => {
    setNodeToEdit(node);
    setShowEditDialog(true);
  };

  const handleUpdateNode = (updates) => {
    if (!nodeToEdit) return;
    
    dispatch(updateStructureNode({ nodeId: nodeToEdit.id, updates })).then((result) => {
      if (result.type === "structure/updateNode/fulfilled") {
        toast.success(`${nodeToEdit.type === 'folder' ? 'Folder' : 'File'} updated successfully!`);
        dispatch(fetchStructure()); // Refresh tree
        setShowEditDialog(false);
        setNodeToEdit(null);
        // Update selected node if it was the one being edited
        if (selectedNode && selectedNode.id === nodeToEdit.id) {
          dispatch(setSelectedNode({ ...nodeToEdit, ...updates }));
        }
      }
    });
  };

  const handleDeleteNode = (node) => {
    if (!node) return;
    
    // Show confirmation dialog
    import('primereact/confirmdialog').then(({ confirmDialog }) => {
      confirmDialog({
        message: `Are you sure you want to delete "${node.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: () => {
          dispatch(deleteStructureNode(node.id)).then((result) => {
            if (result.type === "structure/deleteNode/fulfilled") {
              toast.success(`${node.type === 'folder' ? 'Folder' : 'File'} deleted successfully!`);
              dispatch(fetchStructure()); // Refresh tree
              // Clear selection if deleted node was selected
              if (selectedNode && selectedNode.id === node.id) {
                dispatch(setSelectedNode(null));
              }
            }
          });
        }
      });
    });
  };

  const toolbarStartContent = (
    <div className="flex gap-2">
      <Button
        label="New Folder"
        
        className="p-button-success"
        onClick={() => handleCreateFolder()}
      />
      
    </div>
  );

  const toolbarEndContent = (
    <div className="flex gap-2">
      <Button
        icon="pi pi-refresh"
        className="p-button-outlined"
        onClick={() => dispatch(fetchStructure())}
        loading={loading}
        tooltip="Refresh"
      />
      <Badge value={tree.length} severity="info" />
    </div>
  );

  return (
    <div className="p-4">
      <ConfirmDialog />
      
      <Card title="📁 File Structure Manager" className="mb-4">
        <Toolbar start={toolbarStartContent} end={toolbarEndContent} className="mb-4" />
        
        <Splitter style={{ height: "600px" }}>
          <SplitterPanel size={60} minSize={30}>
            <Panel header="Structure Tree" className="h-full">
              {loading && tree.length === 0 ? (
                <div className="flex justify-content-center align-items-center h-full">
                  <div className="text-center">
                    <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
                    <div>Loading structure...</div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <i className="pi pi-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                  <div className="text-900 font-medium text-xl mb-2">Error Loading Structure</div>
                  <div className="text-600 mb-4">{error}</div>
                  <Button
                    label="Retry"
                    icon="pi pi-refresh"
                    className="p-button-outlined"
                    onClick={() => dispatch(fetchStructure())}
                  />
                </div>
              ) : tree.length === 0 ? (
                <div className="text-center py-8">
                  <i className="pi pi-folder-open text-6xl text-400 mb-4"></i>
                  <div className="text-900 font-medium text-xl mb-2">No structure yet</div>
                  <div className="text-600 mb-4">Create your first folder to get started!</div>
                  <Button
                    label="Create Folder"
                    icon="pi pi-folder"
                    className="p-button-success"
                    onClick={() => handleCreateFolder()}
                  />
                </div>
              ) : (
                <StructureTree
                  nodes={tree}
                  onNodeSelect={(node) => dispatch(setSelectedNode(node))}
                  onCreateFolder={handleCreateFolder}
                  onCreateFile={handleCreateFile}
                  onEditNode={handleEditNode}
                  onDeleteNode={handleDeleteNode}
                  selectedNode={selectedNode}
                />
              )}
            </Panel>
          </SplitterPanel>
          
          <SplitterPanel size={40} minSize={20}>
            <Panel header="Node Details" className="h-full">
              <NodeDetails
                node={selectedNode}
                onCreateFolder={handleCreateFolder}
                onCreateFile={handleCreateFile}
                onEditNode={handleEditNode}
                onDeleteNode={handleDeleteNode}
              />
            </Panel>
          </SplitterPanel>
        </Splitter>
      </Card>

      <CreateNodeDialog
        visible={showCreateDialog}
        onHide={() => {
          setShowCreateDialog(false);
          setParentForNewNode(null);
        }}
        onSubmit={handleCreateNode}
        parentNode={parentForNewNode}
      />

      <EditNodeDialog
        visible={showEditDialog}
        onHide={() => {
          setShowEditDialog(false);
          setNodeToEdit(null);
        }}
        onSubmit={handleUpdateNode}
        node={nodeToEdit}
      />
    </div>
  );
};

export default StructurePage;