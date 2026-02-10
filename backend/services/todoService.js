import db from "../config/db.js";
import { promisify } from "util";

// Promisify db.query for async/await usage
const query = promisify(db.query).bind(db);

// Get all todos for a user
export const getTodosService = async (userId) => {
    try {
        const result = await query(
            "SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC",
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

export const createTodoService = async (userId, title, description, date) => {
    if (!title || title.trim() === "") {
        throw {
            status: 400,
            message: "Todo title is required",
        };
    }

    try {
        const result = await query(
            "INSERT INTO todos (user_id, title, description, date) VALUES (?, ?, ?, ?)",
            [userId, title, description, date]
        );

        return {
            id: result.insertId,
            user_id: userId,
            title,
            description,
            date: date,
            status: "pending",
            created_at: new Date(),
        };
    } catch (err) {
        throw {
            status: 500,
            message: "Failed to create todo",
        };
    }
};

export const updateTodoService = async (todoId, userId, updates) => {
    try {
        // First check if todo belongs to user
        const result = await query(
            "SELECT * FROM todos WHERE id = ? AND user_id = ?",
            [todoId, userId]
        );

        if (!result.length) {
            throw {
                status: 404,
                message: "Todo not found",
            };
        }

        const allowedFields = ["title", "description", "status", "date"];
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
        const values = [...Object.values(updateData), todoId, userId];

        await query(
            `UPDATE todos SET ${setClause} WHERE id = ? AND user_id = ?`,
            values
        );

        return {
            id: todoId,
            ...result[0],
            ...updateData,
        };
    } catch (err) {
        if (err.status) {
            throw err;
        }
        throw {
            status: 500,
            message: "Failed to update todo",
        };
    }
};

// Delete a todo
export const deleteTodoService = async (todoId, userId) => {
    try {
        const result = await query(
            "DELETE FROM todos WHERE id = ? AND user_id = ?",
            [todoId, userId]
        );

        if (result.affectedRows === 0) {
            throw {
                status: 404,
                message: "Todo not found",
            };
        }

        return { message: "Todo deleted successfully" };
    } catch (err) {
        if (err.status) {
            throw err;
        }
        throw {
            status: 500,
            message: "Failed to delete todo",
        };
    }
};
