import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTodos } from "../features/todos/todoSlice";
import { fetchExpenses } from "../features/expenses/expenseSlice";

import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const { name, email } = useSelector((s) => s.auth);
  const { todos, loading: todosLoading } = useSelector((s) => s.todos);
  const { expenses } = useSelector((s) => s.expenses);

  useEffect(() => {
    dispatch(fetchTodos());
    dispatch(fetchExpenses());
  }, [dispatch]);

  /* ===================== CALCULATIONS ===================== */

  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  const completedTodos = todos.filter(t => t.status === "completed").length;

  /* ===================== TEMPLATES ===================== */

  const statusTemplate = (rowData) => {
    const map = {
      pending: { severity: "warning", icon: "pi pi-clock" },
      "in-progress": { severity: "info", icon: "pi pi-spinner pi-spin" },
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

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen surface-ground p-6">
      
      {/* HEADER */}
      <div className="flex align-items-center justify-content-between mb-6">
        <div className="flex align-items-center">
          
          <div>
            <h1 className="text-4xl font-bold m-0">Admin Dashboard</h1>
            
          </div>
        </div>
       
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid mb-5">
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="border-left-3 border-blue-500">
            <span className="block text-500 mb-2">Total Todos</span>
            <div className="text-900 text-3xl font-bold">{todos.length}</div>
            <div className="text-blue-500 text-sm mt-2">
              {completedTodos} completed
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <Card className="border-left-3 border-green-500">
            <span className="block text-500 mb-2">Total Expenses</span>
            <div className="text-900 text-3xl font-bold">
              ₹{totalExpenses.toFixed(2)}
            </div>
            <div className="text-green-500 text-sm mt-2">
              {expenses.length} transactions
            </div>
          </Card>
        </div>
      </div>

      {/* TODOS TABLE */}
      <Card title="📋 My Todos">
        {todos.length === 0 ? (
          <div className="text-center py-6 text-500">
            No todos found
          </div>
        ) : (
          <DataTable
            value={todos}
            loading={todosLoading}
            paginator
            rows={10}
            className="p-datatable-striped"
          >
            <Column field="title" header="Title" sortable />
            <Column
              field="description"
              header="Description"
              body={(row) =>
                row.description
                  ? row.description.length > 80
                    ? row.description.slice(0, 80) + "..."
                    : row.description
                  : <span className="text-500">No description</span>
              }
            />
            <Column field="status" header="Status" body={statusTemplate} sortable />
            <Column
              field="created_at"
              header="Created"
              body={(row) =>
                row.created_at
                  ? new Date(row.created_at).toLocaleDateString()
                  : "-"
              }
              sortable
            />
          </DataTable>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
