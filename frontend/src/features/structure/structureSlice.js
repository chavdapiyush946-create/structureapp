import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async thunks for API calls
export const fetchStructure = createAsyncThunk(
  "structure/fetchStructure",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/structure");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch structure");
    }
  }
);

export const createStructureNode = createAsyncThunk(
  "structure/createNode",
  async (nodeData, { rejectWithValue }) => {
    try {
      const response = await api.post("/structure", nodeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to create node");
    }
  }
);

export const deleteStructureNode = createAsyncThunk(
  "structure/deleteNode",
  async (nodeId, { rejectWithValue }) => {
    try {
      await api.delete(`/structure/${nodeId}`);
      return nodeId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete node");
    }
  }
);

const structureSlice = createSlice({
  name: "structure",
  initialState: {
    tree: [],
    loading: false,
    error: null,
    selectedNode: null,
    expandedNodes: [],
  },
  reducers: {
    setSelectedNode: (state, action) => {
      state.selectedNode = action.payload;
    },
    toggleNodeExpansion: (state, action) => {
      const nodeId = action.payload;
      if (state.expandedNodes.includes(nodeId)) {
        state.expandedNodes = state.expandedNodes.filter(id => id !== nodeId);
      } else {
        state.expandedNodes.push(nodeId);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch structure
      .addCase(fetchStructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStructure.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload;
      })
      .addCase(fetchStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create node
      .addCase(createStructureNode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStructureNode.fulfilled, (state, action) => {
        state.loading = false;
        
      })
      .addCase(createStructureNode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete node
      .addCase(deleteStructureNode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStructureNode.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh will be handled by component
      })
      .addCase(deleteStructureNode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedNode, toggleNodeExpansion, clearError } = structureSlice.actions;
export default structureSlice.reducer;