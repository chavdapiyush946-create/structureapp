import db from "../config/db.js";
import { promisify } from "util";

// Promisify db.query for async/await usage
const query = promisify(db.query).bind(db);

// Get all expenses for a user
export const getExpensesService = async (userId) => {
  try {
    const result = await query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );
    return result;
  } catch (err) {
    throw {
      status: 500,
      message: "Database error",
    };
  }
};

// Create a new expense
export const createExpenseService = async (
  userId,
  title,
  amount,
  category,
  description,
  date
) => {
  if (!title || title.trim() === "") {
    throw {
      status: 400,
      message: "Expense title is required",
    };
  }

  if (!amount || amount <= 0) {
    throw {
      status: 400,
      message: "Expense amount must be greater than 0",
    };
  }

  if (!date) {
    throw {
      status: 400,
      message: "Expense date is required",
    };
  }

  try {
    const result = await query(
      "INSERT INTO expenses (user_id, title, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, title, amount, category || null, description || null, date]
    );

    return {
      id: result.insertId,
      user_id: userId,
      title,
      amount,
      category: category || null,
      description: description || null,
      date,
      created_at: new Date(),
    };
  } catch (err) {
    throw {
      status: 500,
      message: "Failed to create expense",
    };
  }
};

// Update an expense
export const updateExpenseService = async (expenseId, userId, updates) => {
  try {
    // First check if expense belongs to user
    const result = await query(
      "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId]
    );

    if (!result.length) {
      throw {
        status: 404,
        message: "Expense not found",
      };
    }

    const allowedFields = ["title", "amount", "category", "description", "date"];
    const updateData = {};
    for (let field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return result[0];
    }

    const setClause = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updateData), expenseId, userId];

    await query(
      `UPDATE expenses SET ${setClause} WHERE id = ? AND user_id = ?`,
      values
    );

    return {
      id: expenseId,
      ...result[0],
      ...updateData,
    };
  } catch (err) {
    if (err.status) {
      throw err;
    }
    throw {
      status: 500,
      message: "Failed to update expense",
    };
  }
};

// Delete an expense
export const deleteExpenseService = async (expenseId, userId) => {
  try {
    const result = await query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId]
    );

    if (result.affectedRows === 0) {
      throw {
        status: 404,
        message: "Expense not found",
      };
    }

    return { message: "Expense deleted successfully" };
  } catch (err) {
    if (err.status) {
      throw err;
    }
    throw {
      status: 500,
      message: "Failed to delete expense",
    };
  }
};
