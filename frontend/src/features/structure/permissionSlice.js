import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// fetch all users (for sharing)
export const fetchUsers = createAsyncThunk(
  "permissions/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/users");
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to load users");
    }
  }
);

export const grantPermission = createAsyncThunk(
  "permissions/grant",
  async (payload, thunkAPI) => {
    try {
      const { data } = await api.post("/permissions", payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to grant permission");
    }
  }
);

const permissionSlice = createSlice({
  name: "permissions",
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPermissionError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(grantPermission.fulfilled, (state, action) => {
        // Permission granted successfully, no local state update needed
        state.error = null;
      })
      .addCase(grantPermission.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPermissionError } = permissionSlice.actions;
export default permissionSlice.reducer;
