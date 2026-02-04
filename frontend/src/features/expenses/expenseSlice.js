import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

// Fetch all expenses
export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses", 
  async (thunkAPI) => { 
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data; //return payload     
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch expenses"
      );
    }
  }
);

// Create expense
export const createExpense = createAsyncThunk(
  "expenses/createExpense",
  async (expenseData, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.post("/expenses", expenseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create expense"
      );
    }
  }
);


// Update expense
export const updateExpense = createAsyncThunk(
  "expenses/updateExpense",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      const { data } = await api.put(`/expenses/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update expense"
      );
    }
  }
);


export const deleteExpense = createAsyncThunk(
  "expenses/deleteExpense",
  async (id, thunkAPI) => {
    try {
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).token
        : null;
      await api.delete(`/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to delete expense"
      );
    }
  }
);

const expenseSlice = createSlice({
  name: "expenses",
  initialState: {
    expenses: [],
    loading: false,
    error: null,
  },



  extraReducers: (builder) => {
    // Fetch expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create expense
    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
      })
      .addCase(createExpense.fulfilled, (state,action) => {
        state.loading = false;
        state.expenses.push(action.payload);
      })
      .addCase(createExpense.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload;
      });

      


    // Update expense
    builder
      .addCase(updateExpense.fulfilled, (state,action) => {
        const index = state.expenses.findIndex(
          (e) => e.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })

      .addCase(updateExpense.rejected, (state,action) => {
        state.error = action.payload;
      });

      

    // Delete expense
    builder
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
        
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default expenseSlice.reducer;
