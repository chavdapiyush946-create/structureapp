import { registerUserService, loginUserService } from "../services/authService.js";


// 🔹 REGISTER CONTROLLER
export const register = async (req, res) => {
  try {
    const { name, email, password, age, phone, address, role } = req.body;
    const result = await registerUserService(name, email, password, age, phone, address, role);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    // result now includes user id
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};