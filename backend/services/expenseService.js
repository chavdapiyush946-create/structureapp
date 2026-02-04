import db from "../config/db.js";

// Get all expenses for a user
export const getExpensesService = (userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId],
      (err, result) => {
        if (err) {
          return reject({
            status: 500,
            message: "Database error",
          });
        }
        resolve(result);
      }
    );
  });
};

// Create a new expense
export const createExpenseService = (
  userId,
  title,
  amount,
  category,
  description,
  date
) => {
  return new Promise((resolve, reject) => {
    if (!title || title.trim() === "") {
      return reject({
        status: 400,
        message: "Expense title is required",
      });
    }

    if (!amount || amount <= 0) {
      return reject({
        status: 400,
        message: "Expense amount must be greater than 0",
      });
    }

    if (!date) {
      return reject({
        status: 400,
        message: "Expense date is required",
      });
    }

    db.query(
      "INSERT INTO expenses (user_id, title, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, title, amount, category || null, description || null, date],
      (err, result) => {
        if (err) {
          return reject({
            status: 500,
            message: "Failed to create expense",
          });
        }
        resolve({
          id: result.insertId,
          user_id: userId,
          title,
          amount,
          category: category || null,
          description: description || null,
          date,
          created_at: new Date(),
        });
      }
    );
  });
};

// Update an expense
export const updateExpenseService = (expenseId, userId, updates) => {
  return new Promise((resolve, reject) => {
    // First check if expense belongs to user
    db.query(
      "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId],
      (err, result) => {
        if (err) {
          return reject({
            status: 500,
            message: "Database error",
          });
        }

        if (!result.length) {
          return reject({
            status: 404,
            message: "Expense not found",
          });
        }

        const allowedFields = ["title", "amount", "category", "description", "date"];
        const updateData = {};
        for (let field of allowedFields) {
          if (updates[field] !== undefined) {
            updateData[field] = updates[field];
          }
        }

        if (Object.keys(updateData).length === 0) {
          return resolve(result[0]);
        }

        const setClause = Object.keys(updateData)
          .map((key) => `${key} = ?`)
          .join(", ");
        const values = [...Object.values(updateData), expenseId, userId];

        db.query(
          `UPDATE expenses SET ${setClause} WHERE id = ? AND user_id = ?`,
          values,
          (err) => {
            if (err) {
              return reject({
                status: 500,
                message: "Failed to update expense",
              });
            }

            resolve({
              id: expenseId,
              ...result[0],
              ...updateData,
            });
          }
        );
      }
    );
  });
};

// Delete an expense
export const deleteExpenseService = (expenseId, userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [expenseId, userId],
      (err, result) => {
        if (err) {
          return reject({
            status: 500,
            message: "Failed to delete expense",
          });
        }

        if (result.affectedRows === 0) {
          return reject({
            status: 404,
            message: "Expense not found",
          });
        }

        resolve({ message: "Expense deleted successfully" });
      }
    );
  });
};
