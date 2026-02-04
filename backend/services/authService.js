import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// 🔹 REGISTER USER SERVICE
export const registerUserService = (
  name,
  email,
  password,
  age,
  phone,
  address,
  role
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // ✅ REQUIRED FIELD VALIDATION
      if (!name || !email || !password || !age || !phone || !address) {
        return reject({
          status: 400,
          message: "All fields are required",
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reject({
          status: 400,
          message: "Please enter a valid email address",
        });
      }

      // Password length validation
      if (password.length < 6) {
        return reject({
          status: 400,
          message: "Password must be at least 6 characters",
        });
      }

      // Age validation
      if (age < 1 || age > 120) {
        return reject({
          status: 400,
          message: "Age must be between 1 and 120",
        });
      }

      // Phone length validation
      if (phone.length < 10) {
        return reject({
          status: 400,
          message: "Phone number must be at least 10 characters",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name, email, password, age, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, email, hashedPassword, age, phone, address, role || "user"],
        (err) => {
          if (err) {
            return reject({
              status: 400,
              message: "Email already exists",
            });
          }
          resolve({ message: "Registration successful" });
        }
      );
    } catch (err) {
      reject({
        status: 500,
        message: "Server error during registration",
      });
    }
  });
};

// 🔹 LOGIN USER SERVICE
export const loginUserService = (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!email || !password) {
        return reject({
          status: 400,
          message: "Email and password are required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reject({
          status: 400,
          message: "Invalid email address",
        });
      }

      db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {
          if (err) {
            return reject({
              status: 500,
              message: "Database error",
            });
          }

          if (!result.length) {
            return reject({
              status: 400,
              message: "User not found",
            });
          }

          const user = result[0];
          const isMatch = await bcrypt.compare(password, user.password);

          if (!isMatch) {
            return reject({
              status: 400,
              message: "Invalid password",
            });
          }

          const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          resolve({
            token,
            role: user.role,
            name: user.name,
            email: user.email,
          });
        }
      );
    } catch {
      reject({
        status: 500,
        message: "Server error during login",
      });
    }
  });
};
