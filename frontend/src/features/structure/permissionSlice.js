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

export const fetchFolderPermissions = createAsyncThunk(
  "permissions/fetchFolder",
  async (folderId, thunkAPI) => {
    try {
      const { data } = await api.get(`/permissions/${folderId}`);
      return { folderId, list: data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch permissions");
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

export const revokePermission = createAsyncThunk(
  "permissions/revoke",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/permissions/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to revoke permission");
    }
  }
);

const permissionSlice = createSlice({
  name: "permissions",
  initialState: {
    users: [],
    folderPermissions: {}, // map folderId -> list
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
      .addCase(fetchFolderPermissions.fulfilled, (state, action) => {
        state.folderPermissions[action.payload.folderId] = action.payload.list;
      })
      .addCase(fetchFolderPermissions.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(grantPermission.fulfilled, (state, action) => {
        const fold = action.payload.folder_id;
        if (!state.folderPermissions[fold]) state.folderPermissions[fold] = [];
        // replace existing entry if same user
        const idx = state.folderPermissions[fold].findIndex(p => p.user_id === action.payload.user_id);
        if (idx !== -1) {
          state.folderPermissions[fold][idx] = action.payload;
        } else {
          state.folderPermissions[fold].push(action.payload);
        }
      })
      .addCase(grantPermission.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(revokePermission.fulfilled, (state, action) => {
        const id = action.payload;
        for (const fold in state.folderPermissions) {
          state.folderPermissions[fold] = state.folderPermissions[fold].filter(p => p.id !== id);
        }
      })
      .addCase(revokePermission.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPermissionError } = permissionSlice.actions;
export default permissionSlice.reducer;
