import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

export const fetchTodos = createAsyncThunk(
  "todos/fetchTodos",
  async (thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.get("/todos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch todos"
      );
    }
  }
);

// Create todo
export const createTodo = createAsyncThunk(
  "todos/createTodo",
  async (todoData, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.post("/todos", todoData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create todo"
      );
    }
  }
);

export const updateTodo = createAsyncThunk(
  "todos/updateTodo",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.put(`/todos/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update todo"
      );
    }
  }
);

// Delete todo
export const deleteTodo = createAsyncThunk(
  "todos/deleteTodo",
  async (id, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      await api.delete(`/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to delete todo"
      );
    }
  }
);

const todoSlice = createSlice({
  name: "todos",
  initialState: {
    todos: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    // Fetch todos
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create todo
    builder
      .addCase(createTodo.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.push(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update todo
    builder
      .addCase(updateTodo.fulfilled, (state, action) => {
        const index = state.todos.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete todo
    builder
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default todoSlice.reducer;
