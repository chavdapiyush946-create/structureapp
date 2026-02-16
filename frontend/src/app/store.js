import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import todoReducer from "../features/todos/todoSlice";
import expenseReducer from "../features/expenses/expenseSlice";
import structureReducer from "../features/structure/structureSlice";
import permissionReducer from "../features/structure/permissionSlice";

export default configureStore({
  reducer: {
    auth: authReducer,
    todos: todoReducer,
    expenses: expenseReducer,
    structure: structureReducer,
    permissions: permissionReducer,
  },
});


