import { insert, queryOne } from "../utils/db";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  nickname: string | null;
  created_at: Date;
}

export const createUser = async (
  id: string,
  email: string,
  passwordHash: string,
  nickname?: string,
): Promise<void> => {
  await insert(
    "INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)",
    [id, email, passwordHash, nickname || null],
  );
};

export const getUserByEmail = async (
  email: string,
): Promise<User | null> => {
  return queryOne("SELECT * FROM users WHERE email = ?", [email]);
};

export const getUserById = async (id: string): Promise<User | null> => {
  return queryOne("SELECT * FROM users WHERE id = ?", [id]);
};
