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

// fetch all users with their permissions for a specific folder
export const fetchFolderUsers = createAsyncThunk(
  "permissions/fetchFolderUsers",
  async (folderId, thunkAPI) => {
    try {
      const { data } = await api.get(`/folders/${folderId}/permissions`);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to load folder permissions");
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
    folderUsers: [],
    loading: false,
    folderUsersLoading: false,
    granting: false,
    error: null,
  },
  reducers: {
    clearPermissionError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFolderUsers.pending, (state) => {
        state.folderUsersLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderUsers.fulfilled, (state, action) => {
        state.folderUsersLoading = false;
        state.folderUsers = action.payload;
        state.error = null;
      })
      .addCase(fetchFolderUsers.rejected, (state, action) => {
        state.folderUsersLoading = false;
        state.error = action.payload;
      })
      .addCase(grantPermission.pending, (state) => {
        state.granting = true;
        state.error = null;
      })
      .addCase(grantPermission.fulfilled, (state, action) => {
        state.granting = false;
        state.error = null;
      })
      .addCase(grantPermission.rejected, (state, action) => {
        state.granting = false;
        state.error = action.payload;
      });
  },
});

export const { clearPermissionError } = permissionSlice.actions;
export default permissionSlice.reducer;
