import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { promisify } from "util";

// Promisify db.query for async/await usage
const query = promisify(db.query).bind(db);

// 🔹 REGISTER USER SERVICE
export const registerUserService = async (name, email, password, age, phone, address, role) => {
  // ✅ REQUIRED FIELD VALIDATION
  if (!name || !email || !password || !age || !phone || !address) {
    throw {
      status: 400,
      message: "All fields are required",
    };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw {
      status: 400,
      message: "Please enter a valid email address",
    };
  }

  // Password length validation
  if (password.length < 6) {
    throw {
      status: 400,
      message: "Password must be at least 6 characters",
    };
  }

  // Age validation
  if (age < 1 || age > 120) {
    throw {
      status: 400,
      message: "Age must be between 1 and 120",
    };
  }

  // Phone length validation
  if (phone.length < 10) {
    throw {
      status: 400,
      message: "Phone number must be at least 10 characters",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      "INSERT INTO users (name, email, password, age, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, age, phone, address, role || "user"]
    );

    return { message: "Registration successful" };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw {
        status: 400,
        message: "Email already exists",
      };
    }
    throw {
      status: 500,
      message: "Server error during registration",
    };
  }
};

// 🔹 LOGIN USER SERVICE
export const loginUserService = async (email, password) => {
  if (!email || !password) {
    throw {
      status: 400,
      message: "Email and password are required",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw {
      status: 400,
      message: "Invalid email address",
    };
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = ?", [email]);

    if (!result.length) {
      throw {
        status: 400,
        message: "User not found",
      };
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw {
        status: 400,
        message: "Invalid password",
      };
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    };
  } catch (err) {
    if (err.status) {
      throw err;
    }
    throw {
      status: 500,
      message: "Server error during login",
    };
  }
};
