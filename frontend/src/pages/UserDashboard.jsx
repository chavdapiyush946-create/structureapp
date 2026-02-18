import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTodos } from "../features/todos/todoSlice";
import { fetchExpenses } from "../features/expenses/expenseSlice";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { name,email} = useSelector((s) => s.auth);
  const { todos } = useSelector((s) => s.todos);
  const {expenses} = useSelector((s) => s.expenses);
  

  useEffect(() => {
    dispatch(fetchTodos());
    dispatch(fetchExpenses());
  }, [dispatch]);

  const totalExpenses = Array.isArray(expenses) 
    ? expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) 
    : 0;
  const formattedExpenses = Number(totalExpenses).toFixed(2) || "0.00";

  const statusTemplate = (rowData) => {
    const statusMap = {
      pending: { severity: "warning", icon: "pi pi-clock" },
      "in-progress": { severity: "info", icon: "pi pi-spin pi-spinner" },
      completed: { severity: "success", icon: "pi pi-check" },
    };
    const status = statusMap[rowData.status];
    return (
      <Tag 
        value={rowData.status} 
        severity={status.severity} 

        icon={status.icon}
        className="text-sm"
      />
    );
  };

  return (
    <div className="min-h-screen surface-ground">
      <div className="p-6">
        {/* Welcome Header */}
        <div className="flex align-items-center justify-content-between mb-6">
          <div className="flex align-items-center">           
            <div>
              <h1 className="text-4xl font-bold text-900 m-0">Welcome back, {name}!</h1>              
            </div>
          </div>        
        </div>

        {/* Total Expenses Card */}
        <div className="grid mb-4">
          <div className="col-12 md:col-6 lg:col-4">
            <Card className="border-left-3 border-green-500">
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">Total Expenses</span>
                  <div className="text-900 font-medium text-3xl">₹{formattedExpenses}</div>
                  <div className="text-green-500 text-sm mt-2">                    
                    {expenses.length} transactions
                  </div>
                </div>
                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{width: '3rem', height: '3rem'}}>                  
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Todos Section */}
        <div className="grid">
          <div className="col-12">
            <Card title="📋 My Todos" className="mb-4">
              {todos.length === 0 ? (
                <div className="text-center py-8">
                  <i className="pi pi-inbox text-6xl text-400 mb-4"></i>
                  <div className="text-900 font-medium text-xl mb-2">No todos yet</div>
                  <div className="text-600 mb-4">Create your first todo to get started!</div>
                  <Button                  
                    label="Create Todo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={() => navigate("/todo")}                    
                  />
                </div>
              ):(
                <>
                  <DataTable
                    value={todos}
                    paginator
                    rows={10}
                    className="p-datatable-gridlines"
                    paginatorTemplate="FirstPageLInk PrevPageLInk PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} todos"                    
                  >
                    <Column 
                      field="title"                       
                      header="Title" 
                      className="font-medium"                      
                      style={{ minWidth: '200px'}}
                    />
                    <Column 
                      field="description" 
                      header="Description" 
                      body={(rowData) => {
                        if (!rowData.description) return <span className="text-500">No description</span>;
                        return rowData.description.length > 100 
                          ? `${rowData.description.substring(0, 100)}...` 
                          : rowData.description;
                      }}
                      style={{ minWidth: '250px' }}
                    />
                    
                    <Column                         
                      header="Status"                       
                      body={statusTemplate} 
                      sortable
                      field="status"
                      style={{ minWidth: '120px' }}
                    />
                    
                  </DataTable>                  
                  <div className="text-center mt-4">
                    <div className="text-600">
                      Total: {todos.length} todos
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;