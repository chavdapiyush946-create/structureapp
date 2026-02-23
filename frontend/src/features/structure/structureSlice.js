import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchStructure = createAsyncThunk(
  "structure/fetchStructure",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/structure");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch structure");
    }
  }); 

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

export const updateStructureNode = createAsyncThunk(
  "structure/updateNode",
  async ({ nodeId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/structure/${nodeId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to update node");
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

// Fetch children of a specific folder
export const fetchFolderChildren = createAsyncThunk(
  "structure/fetchChildren",
  async (folderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/structure/${folderId}`);
      return { folderId, children: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch children");
    }
  }
);

// Upload file
export const uploadFile = createAsyncThunk(
  "structure/uploadFile",
  async ({ file, parent_id }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (parent_id) {
        formData.append("parent_id", parent_id);
      }

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error('single upload error', error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to upload file";
      return rejectWithValue(msg);
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
    loadingChildren: {},
    uploading: false, 
  },
  reducers: {
    setSelectedNode: (state, action) => {
      state.selectedNode = action.payload;
    },
    setTree: (state, action) => {
      state.tree = action.payload;
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
        state.error = null;
      })
      .addCase(createStructureNode.fulfilled, (state, action) => {
        // No loading state change - will refresh silently
      })
      .addCase(createStructureNode.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update node
      .addCase(updateStructureNode.pending, (state) => {
        state.error = null;
      })
      .addCase(updateStructureNode.fulfilled, (state, action) => {
        // No loading state change - will refresh silently
      })
      .addCase(updateStructureNode.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete node
      .addCase(deleteStructureNode.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteStructureNode.fulfilled, (state, action) => {
        // No loading state change - will refresh silently
      })
      .addCase(deleteStructureNode.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch folder children
      .addCase(fetchFolderChildren.pending, (state, action) => {
        const folderId = action.meta.arg;
        state.loadingChildren[folderId] = true;
        state.error = null;
      })
      .addCase(fetchFolderChildren.fulfilled, (state, action) => {
        const { folderId, children } = action.payload;
        state.loadingChildren[folderId] = false;
        
        // Update the tree with children
        const updateNodeChildren = (nodes) => {
          return nodes.map(node => {
            if (node.id === folderId) {
              return { ...node, children, childrenLoaded: true };
            }
            if (node.children) {
              return { ...node, children: updateNodeChildren(node.children) };
            }
            return node;
          });
        };
        
        state.tree = updateNodeChildren(state.tree);
      })
      .addCase(fetchFolderChildren.rejected, (state, action) => {
        const folderId = action.meta.arg;
        state.loadingChildren[folderId] = false;
        state.error = action.payload;
      })
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedNode, setTree, toggleNodeExpansion, clearError } = structureSlice.actions;
export default structureSlice.reducer;

