import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchStructure } from "../features/structure/structureSlice";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import FileIcon from "./FileIcon";


const StructureWidget = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tree, loading } = useSelector((state) => state.structure);

  useEffect(() => {
    dispatch(fetchStructure());
  }, [dispatch]);

  const countNodes = (nodes) => {
    let folders = 0;
    let files = 0;
    
    const count = (nodeList) => {
      nodeList.forEach(node => {
        if (node.type === 'folder') {
          folders++;
          if (node.children) {
            count(node.children);
          }
        } else {
          files++;
        }
      });
    };
    
    count(nodes);
    return { folders, files, total: folders + files };
  };

  const stats = countNodes(tree);

  return (
    <Card className="border-left-3 border-purple-500">
      <div className="flex justify-content-between align-items-center">
        <div>
          <span className="block text-500 font-medium mb-3">File Structure</span>
          <div className="text-900 font-medium text-3xl">{stats.total}</div>
          <div className="text-purple-500 text-sm mt-2">
            <div className="flex align-items-center gap-2 mb-1">
              <FileIcon type="folder" size="text-sm" />
              <span>{stats.folders} folders</span>
            </div>
            <div className="flex align-items-center gap-2">
              <FileIcon fileName="file.txt" size="text-sm" />
              <span>{stats.files} files</span>
            </div>
          </div>
        </div>
        <div className="flex flex-column align-items-center gap-2">
          <div 
            className="flex align-items-center justify-content-center bg-purple-100 border-round" 
            style={{width: '3rem', height: '3rem'}}
          >
            <i className="pi pi-folder text-purple-500 text-2xl"></i>
          </div>
          
        </div>
      </div>
      
      {loading && (
        <div className="text-center mt-3">
          <i className="pi pi-spin pi-spinner text-purple-500"></i>
        </div>
      )}
    </Card>
  );
};

export default StructureWidget;