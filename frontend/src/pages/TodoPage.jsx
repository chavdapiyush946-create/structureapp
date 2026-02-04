import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../features/todos/todoSlice";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { toast } from "react-toastify";

const TodoPage = () => {
  const dispatch = useDispatch();
  const { todos, loading } = useSelector((state) => state.todos);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    status: "pending",
  });

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  /* ===================== HELPERS ===================== */

  const normalizeDate = (todo) =>
    todo.date || todo.created_at || null

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      status: "pending",
    });
    setEditingId(null);
  };

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async () => {
    const payload = {
      title: formData.title,
      description: formData.description,
      date: formData.date
        ? formData.date.toISOString().split("T")[0]
        : null,
      status: formData.status,
    };

    if (editingId) {
      const res = await dispatch(
        updateTodo({ id: editingId, updates: payload })
      );
      if (res.payload) toast.success("Todo updated ");
    } else {
      const res = await dispatch(createTodo(payload));
      if (res.payload) toast.success("Todo created ");
    }

    setShowDialog(false);
    resetForm();
  };

  /* ===================== ACTIONS ===================== */

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    const dateValue = normalizeDate(todo);

    setFormData({
      title: todo.title,
      description: todo.description || "",
      date: dateValue ? new Date(dateValue) : new Date(),
      status: todo.status,
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this todo?",
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        dispatch(deleteTodo(id));
        toast.success("Todo deleted 🗑️");
      },
    });
  };

  /* ===================== TEMPLATES ===================== */

  const statusTemplate = (rowData) => {
    const map = {
      pending: { severity: "warning", icon: "pi pi-clock" },
      "in-progress": { severity: "info", icon: "pi pi-spin pi-spinner" },
      completed: { severity: "success", icon: "pi pi-check" },
    };

    return (
      <Tag
        value={rowData.status}
        severity={map[rowData.status].severity}
        icon={map[rowData.status].icon}
      />
    );
  };

  const dateTemplate = (rowData) => {
    const dateValue = normalizeDate(rowData);
    if (!dateValue) return <span className="text-500">No date</span>;
    return new Date(dateValue).toLocaleDateString();
  };

  const actionTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text"
        onClick={() => handleEdit(rowData)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        onClick={() => handleDelete(rowData.id)}
      />
    </div>
  );

  /* ===================== UI ===================== */

  return (
    <div className="p-4">
      <ConfirmDialog />

      <Card title="Todo Manager">
        <div className="flex justify-content-end mb-3">
          <Button
            label="New Todo"
            icon="pi pi-plus"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          />
        </div>

        <DataTable
          value={todos}
          loading={loading}
          paginator
          rows={10}
          filters={filters}
          responsiveLayout="scroll"
        >
          <Column field="title" header="Title" />
          <Column field="description" header="Description" />
          <Column header="Date" body={dateTemplate} sortable />
          <Column header="Status" body={statusTemplate} />
          <Column header="Actions" body={actionTemplate} />
        </DataTable>
      </Card>

      {/* ===================== DIALOG ===================== */}

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Todo" : "Create Todo"}
        modal
        style={{ width: "50vw" }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4">
          <div className="field">
            <label>Title </label>
            <InputText
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Description</label>
            <InputTextarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </div>  

          <div className="field">
            <label>Date</label>
            <Calendar
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.value })
              }
              showIcon
              dateFormat="yy-mm-dd"
              className="w-full"
            />
          </div>

          <div className="field">
            <label>Status</label>
            <Dropdown
              value={formData.status}
              options={[
                { label: "Pending", value: "pending" },
                { label: "In Progress", value: "in-progress" },
                { label: "Completed", value: "completed" },
              ]}
              onChange={(e) =>
                setFormData({ ...formData, status: e.value })
              }
            />
          </div>

          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label="Save"
              icon="pi pi-check"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TodoPage;
