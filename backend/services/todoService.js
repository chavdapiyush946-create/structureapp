import db from "../config/db.js";

// Get all todos for a user
export const getTodosService = (userId) => {
    return new Promise((resolve, reject) => {
        db.query(
            "SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC",
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


export const createTodoService = (userId, title, description, date) => {
    return new Promise((resolve, reject) => {
        if (!title || title.trim() === "") {
            return reject({
                status: 400,
                message: "Todo title is required",
            });
        }

        db.query(
            "INSERT INTO todos (user_id, title, description, date) VALUES (?, ?, ?, ?)",
            [userId, title, description, date],
            (err, result) => {
                if (err) {
                    return reject({
                        status: 500,
                        message: "Failed to create todo",
                    });
                }
                resolve({
                    id: result.insertId,
                    user_id: userId,
                    title,
                    description,
                    date: date,
                    status: "pending",
                    created_at:new Date(),
                });
            }
        );
    });
};


export const updateTodoService = (todoId, userId, updates) => {
    return new Promise((resolve, reject) => {
        // First check if todo belongs to user
        db.query(
            "SELECT * FROM todos WHERE id = ? AND user_id = ?",
            [todoId, userId],
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
                        message: "Todo not found",
                    });
                }

                const allowedFields = ["title", "description", "status", "date"];
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
                const values = [...Object.values(updateData), todoId, userId];

                db.query(
                    `UPDATE todos SET ${setClause} WHERE id = ? AND user_id = ?`,
                    values,
                    (err) => {
                        if (err) {
                            return reject({
                                status: 500,
                                message: "Failed to update todo",
                            });
                        }

                        resolve({
                            id: todoId,
                            ...result[0],
                            ...updateData,
                        });
                    }
                );
            }
        );
    });
};

// Delete a todo
export const deleteTodoService = (todoId, userId) => {
    return new Promise((resolve, reject) => {
        db.query(
            "DELETE FROM todos WHERE id = ? AND user_id = ?",
            [todoId, userId],
            (err, result) => {
                if (err) {
                    return reject({
                        status: 500,
                        message: "Failed to delete todo",
                    });
                }

                if (result.affectedRows === 0) {
                    return reject({
                        status: 404,
                        message: "Todo not found",
                    });
                }

                resolve({ message: "Todo deleted successfully" });
            }
        );
    });
};
