import {
  getExpensesService,
  createExpenseService,
  updateExpenseService,
  deleteExpenseService,
} from "../services/expenseService.js";

// Get all expenses
export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await getExpensesService(userId);
    res.status(200).json(expenses);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Create an expense
export const createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, category, description, date } = req.body;
    const expense = await createExpenseService(
      userId,
      title,
      amount,
      category,
      description,
      date
    );
    res.status(201).json(expense);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Update an expense
export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const updates = req.body;
    const expense = await updateExpenseService(expenseId, userId, updates);
    res.status(200).json(expense);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Delete an expense
export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const result = await deleteExpenseService(expenseId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
