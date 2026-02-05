import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import CustomIcon from "./CustomIcon";

const EditNodeDialog = ({ visible, onHide, onSubmit, node }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "folder",
  });
  
  const [errors, setErrors] = useState({});

  const typeOptions = [
    { label: "📁 Folder", value: "folder" },
    { label: "📄 File", value: "file" },
  ];

  useEffect(() => {
    if (visible && node) {
      setFormData({
        name: node.name || "",
        type: node.type || "folder",
      });
      setErrors({});
    }
  }, [visible, node]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z0-9._-\s]+$/.test(formData.name)) {
      newErrors.name = "Name contains invalid characters";
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
    setFormData({ ...formData, type: newType });
    
    // Clear type error when changed
    if (errors.type) {
      setErrors({ ...errors, type: null });
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
        label="Update"
        icon="pi pi-check"
        onClick={handleSubmit}
        disabled={!formData.name.trim()}
      />
    </div>
  );

  if (!node) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Edit ${node.type === 'folder' ? 'Folder' : 'File'}`}
      footer={dialogFooter}
      style={{ width: "500px" }}
      modal
      className="p-fluid"
    >
      {/* Current Info */}
      <div className="mb-4">
        <Message
          severity="info"
          text={`Editing: ${node.name}`}
          className="w-full"
        />
      </div>

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

      <Divider />

      {/* Preview */}
      <div className="surface-50 border-round p-3">
        <div className="flex align-items-center gap-2">
          <CustomIcon type={formData.type} size={20} className="text-600" />
          <div>
            <div className="font-medium">
              {formData.name || `Unnamed ${formData.type}`}
            </div>
            <div className="text-sm text-600">
              {formData.type === 'folder' ? 'Folder' : 'File'}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default EditNodeDialog;