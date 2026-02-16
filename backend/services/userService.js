import db from "../config/db.js";
import { promisify } from "util";

const query = promisify(db.query).bind(db);

export const getUsers = async () => {
  const rows = await query("SELECT id, name, email FROM users");
  return rows;
};
