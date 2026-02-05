import { useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import CustomIcon from "./CustomIcon";


const StructureTree = ({
  nodes,
  onNodeSelect,
  onCreateFolder,
  onCreateFile,
  onEditNode,
  onDeleteNode,
  selectedNode
}) => {
  const [contextMenuItems] = useState([
    {
      label: "New Folder",
      icon: "pi pi-folder",
      command: () => {
        if (contextMenuNode) {
          onCreateFolder(contextMenuNode.type === 'folder' ? contextMenuNode : null);
        }
      }
    },
    {
      label: "New File",
      icon: "pi pi-file",
      command: () => {
        if (contextMenuNode && contextMenuNode.type === 'folder') {
          onCreateFile(contextMenuNode);
        }
      }
    },
    { separator: true },
    {
      label: "Edit",
      icon: "pi pi-pencil",
      command: () => {
        if (contextMenuNode) {
          onEditNode(contextMenuNode);
        }
      }
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      className: "text-red-500",
      command: () => {
        if (contextMenuNode) {
          onDeleteNode(contextMenuNode);
        }
      }
    }
  ]);

  const [contextMenuNode, setContextMenuNode] = useState(null);
  let contextMenu;

  // Convert structure data to PrimeReact Tree format
  const convertToTreeNodes = (nodes) => {
    return nodes.map(node => ({
      key: node.id.toString(),
      label: node.name,
      data: node,
      children: node.children ? convertToTreeNodes(node.children) : [],
      leaf: node.type === 'file',
      selectable: true,
    }));
    
  };

  const treeNodes = convertToTreeNodes(nodes);

  const nodeTemplate = (node, options) => {
    const isSelected = selectedNode && selectedNode.id.toString() === node.key;
    
    return (
      <div
        className={`flex align-items-center gap-2 p-2 border-round cursor-pointer hover:surface-100 ${
          isSelected ? 'bg-primary-50 text-primary-700' : ''
        }`}
        onContextMenu={(e) => {
          setContextMenuNode(node.data);
          contextMenu.show(e);
        }}
        onClick={() => onNodeSelect(node.data)}
      >
        <CustomIcon 
          type={node.data.type} 
          size={20} 
          className={isSelected ? 'text-primary-700' : 'text-600'} 
        />
        <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-900'}`}>
          {node.label}
        </span>
        {node.data.type === 'folder' && node.children && (
          <Badge
            value={node.children.length}
            severity="secondary"
            size="small"
            className="ml-auto"
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-full">
      <ContextMenu
        model={contextMenuItems}
        ref={(el) => contextMenu = el}
      />

      {treeNodes.length > 0 ? (
        <Tree
          value={treeNodes}
          nodeTemplate={nodeTemplate}
          className="w-full"
          style={{ border: 'none' }}
        />
      ) : (
        <div className="text-center py-4 text-500">
          <i className="pi pi-folder-open text-4xl mb-3"></i>
          <div>No items to display</div>
        </div>
      )}
    </div>
  );
};

export default StructureTree;