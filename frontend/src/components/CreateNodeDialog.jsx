import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";

const CreateNodeDialog = ({ visible, onHide, onSubmit, parentNode }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "folder",
    parent_id: null,
  });
  
  const [errors, setErrors] = useState({});

  const typeOptions = [
    { label: "📁 Folder", value: "folder", icon: "pi pi-folder" },
    { label: "📄 File", value: "file", icon: "pi pi-file" },
  ];

  useEffect(() => {
    if (visible) {
      setFormData({
        name: "",
        type: parentNode ? "file" : "folder",
        parent_id: parentNode?.id || null,
      });
      setErrors({});
    }
  }, [visible, parentNode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.type === "file" && !formData.parent_id) {
      newErrors.type = "Files must be created inside a folder";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    
    // Clear name error when user starts typing
    if (errors.name && value.trim()) {
      setErrors({ ...errors, name: null });
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.value;
    setFormData({ 
      ...formData, 
      type: newType,
      parent_id: newType === "file" && !formData.parent_id ? parentNode?.id || null : formData.parent_id
    });
    
    // Clear type error when changed
    if (errors.type) {
      setErrors({ ...errors, type: null });
    }
  };

  const getFileExtensionSuggestions = () => {
    return [
      ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", 
    ];
  };

  const addExtension = (ext) => {
    if (!formData.name.includes('.')) {
      setFormData({ ...formData, name: formData.name + ext });
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
      />
      <Button
        label="Create"
        icon="pi pi-check"
        onClick={handleSubmit}
        disabled={!formData.name.trim()}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Create New ${formData.type === 'folder' ? 'Folder' : 'File'}`}
      footer={dialogFooter}
      style={{ width: "500px" }}
      modal
      className="p-fluid"
    >
      {/* Parent Info */}
      {parentNode && (
        <div className="mb-4">
          <Message
            severity="info"
            text={`Creating in: ${parentNode.name}`}
            className="w-full"
          />
        </div>
      )}

      {/* Type Selection */}
      <div className="field">
        <label htmlFor="type" className="font-medium">Type *</label>
        <Dropdown
          id="type"
          value={formData.type}
          options={typeOptions}
          onChange={handleTypeChange}
          optionLabel="label"
          optionValue="value"
          className={errors.type ? "p-invalid" : ""}
        />
        {errors.type && (
          <small className="p-error">{errors.type}</small>
        )}
      </div>

      {/* Name Input */}
      <div className="field">
        <label htmlFor="name" className="font-medium">Name *</label>
        <InputText
          id="name"
          value={formData.name}
          onChange={handleNameChange}
          placeholder={`Enter ${formData.type} name`}
          className={errors.name ? "p-invalid" : ""}
          autoFocus
        />
        {errors.name && (
          <small className="p-error">{errors.name}</small>
        )}
      </div>

      {/* File Extension Suggestions */}
      {formData.type === "file" && (
        <div className="field">
          <label className="font-medium">Quick Extensions</label>
          <div className="flex flex-wrap gap-1 mt-2">
            {getFileExtensionSuggestions().map((ext) => (
              <Button
                key={ext}
                label={ext}
                size="small"
                className="p-button-outlined p-button-sm"
                onClick={() => addExtension(ext)}
              />
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* Preview */}
      <div className="surface-50 border-round p-3">
        <div className="flex align-items-center gap-2">
          <i className={`${formData.type === 'folder' ? 'pi pi-folder text-yellow-500' : 'pi pi-file text-blue-500'} text-xl`}></i>
          <div>
            <div className="font-medium">
              {formData.name || `New ${formData.type}`}
            </div>
            <div className="text-sm text-600">
              {parentNode ? `in ${parentNode.name}` : 'in root'}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateNodeDialog;