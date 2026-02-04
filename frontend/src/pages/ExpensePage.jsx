import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../features/expenses/expenseSlice";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { toast } from "react-toastify";

const ExpensePage = () => {
  const dispatch = useDispatch();
  const { expenses, loading } = useSelector((state) => state.expenses);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  

  const [formData, setFormData] = useState({
    title: "",
    amount: null,
    category: "",
    description:"",
    date: new Date(),
  });


  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      title: "",
      amount: null,
      category: "",
      description: "",
      date: new Date(),
    });
    setEditingId(null);
  };

  /* ===================== HANDLERS ===================== */

  const handleSubmit = async () => {

    const payload = {
      title: formData.title,
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      date: formData.date
        ? formData.date.toISOString().split("T")[0]
        : null,
    };

    if (editingId) {
      const res = await dispatch(
        updateExpense({ id: editingId, updates: payload })
      );
      if (res.payload) toast.success("Expense updated ✅");
    } else {
      const res = await dispatch(createExpense(payload));
      if (res.payload) toast.success("Expense created ✅");
    }




    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category || "",
      description: expense.description || "",
      date: new Date(expense.date),
    });
    
    setShowDialog(true);
  };
  

  const handleDelete = (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this expense?",
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        dispatch(deleteExpense(id));
        toast.success("Expense deleted 🗑️");
      },
    });
  };

 

  const amountTemplate = (rowData) => (
    <span className="font-bold text-red-500">
      ₹{Number(rowData.amount || 0).toFixed(2)}
    </span>
  );

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

  const totalAmount = Array.isArray(expenses)
    ? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  /* ===================== UI ===================== */


  return (
    <div className="p-4">
      <ConfirmDialog />

      <Card title="Expense Manager">
        <div className="flex justify-content-end mb-3">
          <Button
            label="Add Expense"
            icon="pi pi-plus"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          />
        </div>

        {expenses.length === 0 ? (
          <p className="text-center text-500">
            No expenses yet. Add one!
          </p>
        ) : (
          <DataTable
            value={expenses}
            loading={loading}
            paginator
            rows={10}
            responsiveLayout="scroll"
            className="p-datatable-striped"
          >
            <Column field="title" header="Title" />
            <Column field="category" header="Category" />
            <Column header="Amount" body={amountTemplate} />
            <Column field="description" header="Description" />
            <Column
              field="date"
              header="Date"
              body={(row) =>
                row.date
                  ? new Date(row.date).toLocaleDateString()
                  : "-"
              }
            />
        
            <Column header="Actions" body={actionTemplate} />
          </DataTable>
        )}

        <div className="text-right mt-3 font-semibold text-red-500">
          Total: ₹{totalAmount.toFixed(2)}
        </div>
      </Card>

      {/* ===================== DIALOG ===================== */}

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Expense" : "Create Expense"}
        modal
        style={{ width: "50vw" }}
        className="p-fluid"
      >
        <div className="flex flex-column gap-4">
          <div className="field">
            <label>Title *</label>
            <InputText
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Amount *</label>
            <InputNumber
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.value })
              }
              mode="currency"
              currency="INR"
              className="w-full"
            />
          </div>

          <div className="field">
            <label>Category</label>
            <InputText
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Description</label>
            <InputTextarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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

export default ExpensePage;
