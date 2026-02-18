import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export const isPreviewable = (node) => {
  if (!node || !node.file_path) return false;
  const ext = (node.name || "").split(".").pop().toLowerCase();
  return [
    "jpg",
    "jpeg",
    "png",
    ].includes(ext);
};

const getFileIcon = (node) => {
  const ext = (node.name || "").split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "pi-image";
  if (["pdf"].includes(ext)) return "pi-file-pdf";
  return "pi-file";
};

const getSyntaxClass = (filename) => {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return "language-javascript";
  if (["json"].includes(ext)) return "language-json";
  if (["html"].includes(ext)) return "language-html";
  return "language-plaintext";
};

const getFileUrl = (node) => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${apiUrl}/api/stream/${node.id}`;
};

export const downloadWithAuth = async (node) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const auth = localStorage.getItem("auth");
    let token = null;
    if (auth) {
      try {
        token = JSON.parse(auth).token;
      } catch (e) {}
    }

    const res = await fetch(`${apiUrl}/api/download/${node.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = node.name || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("downloadWithAuth error", err);
  }
};

const FilePreview = ({ node, visible, onHide }) => {
  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!node || !visible) return;
      const ext = (node.name || "").split(".").pop().toLowerCase();
      const textExtensions = [
        "txt",
        "log",
        "md",
        "json",
        "xml",
        "csv",
        "js",
        "jsx",
        "ts",
        "tsx",
        "css",
        "html",
        "py",
        "java",
        "c",
        "cpp",
        "h",
      ];

      if (!textExtensions.includes(ext)) {
        setFileContent("");
        return;
      }

      setLoadingContent(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/stream/${node.id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        if (mounted) setFileContent(text);
      } catch (err) {
        console.error("Error loading file content:", err);
        if (mounted) setFileContent(`Error loading file content: ${err.message}`);
      } finally {
        if (mounted) setLoadingContent(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [node, visible]);

  return (
    <Dialog
      visible={!!visible && !!node}
      onHide={() => onHide && onHide()}
      header={
        <div className="flex align-items-center gap-3">
          <div className="bg-blue-100 border-circle p-2">
            <i className={`pi ${node ? getFileIcon(node) : "pi-file"} text-blue-500 text-xl`}></i>
          </div>
          <span className="text-2xl font-bold">File Preview</span>
        </div>
      }
      modal
      style={{ width: "800px", maxWidth: "90vw" }}
      className="p-fluid"
    >
      {node && (
        <div className="flex flex-column gap-3">
          <div className="flex align-items-center gap-2">
            <i className={`pi ${getFileIcon(node)} text-2xl text-primary`}></i>
            <div className="font-bold text-xl text-900">{node.name}</div>
          </div>

          {isPreviewable(node) && (
            <div className="border-1 surface-border border-round" style={{ maxHeight: '500px', overflow: 'auto' }}>
              {(() => {
                const ext = (node.name || "").split('.').pop().toLowerCase();
                const fileUrl = getFileUrl(node);

                if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) {
                  return (
                    <div className="text-center p-3">
                      <img src={fileUrl} alt={node.name} style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }} />
                    </div>
                  );
                }

                if (ext === 'pdf') {
                  return <iframe src={fileUrl} style={{ width: '100%', height: '500px', border: 'none' }} title={node.name} />;
                }

                if (["txt","log","md","json","xml","csv","js","jsx","ts","tsx","css","html","py","java","c","cpp","h"].includes(ext)) {
                  return (
                    <div>
                      {loadingContent ? (
                        <div className="text-center p-5">
                          <i className="pi pi-spin pi-spinner text-3xl text-primary mb-3"></i>
                          <div className="text-600">Loading...</div>
                        </div>
                      ) : fileContent ? (
                        <pre className={`text-sm font-mono m-0 ${getSyntaxClass(node.name)}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '500px', overflow: 'auto', padding: '1.5rem', backgroundColor: '#f8f9fa', margin:0 }}>
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

          {!isPreviewable(node) && (
            <div className="text-center p-5 surface-50 border-round">
              <i className="pi pi-eye-slash text-5xl text-400 mb-3"></i>
              <div className="text-900 font-medium text-lg mb-2">Preview not available</div>
              <div className="text-600">This file type cannot be previewed</div>
            </div>
          )}

          <div className="flex justify-content-end gap-2 pt-2">
            <Button label="Close" icon="pi pi-times" className="p-button-text p-button-lg" onClick={() => onHide && onHide()} style={{ borderRadius: '8px' }} />
            <Button label="Download" icon="pi pi-download" className="p-button-lg" onClick={() => downloadWithAuth(node)} style={{ borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default FilePreview;
