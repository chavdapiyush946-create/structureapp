const FileIcon = ({ fileName, type, size = "text-xl", className = "" }) => {
  const getIconClass = () => {
    if (type === 'folder') {
      return 'pi pi-folder text-yellow-500';
    }
    
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      // Documents
      case 'pdf':
        return 'pi pi-file-pdf text-red-500';
      case 'doc':
      case 'docx':
        return 'pi pi-file-word text-blue-500';
      case 'xls':
      case 'xlsx':
        return 'pi pi-file-excel text-green-500';
      case 'ppt':
      case 'pptx':
        return 'pi pi-file text-orange-500';
      // Default
      default:
        return 'pi pi-file text-gray-600';
    }
  };

  return (
    <i className={`${getIconClass()} ${size} ${className}`}></i>
  );
};

export default FileIcon;