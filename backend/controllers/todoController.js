import {
  getTodosService,
  createTodoService,
  updateTodoService,
  deleteTodoService,
} from "../services/todoService.js";

// Get all todos
export const getTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const todos = await getTodosService(userId);
    res.status(200).json(todos);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Create a todo
export const createTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date } = req.body;
    const todo = await createTodoService(userId, title, description, date);
    res.status(201).json(todo);
        
  } catch (error) {
    console.log("err", error);
    
    res.status(error.status || 500).json({ message: error.message });
  }
};


// Update a todo
export const updateTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    const updates = req.body;
    const todo = await updateTodoService(todoId, userId, updates);
    res.status(200).json(todo);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Delete a todo
export const deleteTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const todoId = req.params.id;
    const result = await deleteTodoService(todoId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
