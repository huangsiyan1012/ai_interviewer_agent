import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, getUserById } from "../models/User";
import { signToken } from "../utils/jwt";
import { generateId } from "../utils/uuid";

export class AuthService {
  async register(email: string, password: string, nickname?: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error("邮箱和密码不能为空");
    }
    if (password.length < 6) {
      throw new Error("密码至少 6 位");
    }

    const existing = await getUserByEmail(normalized);
    if (existing) throw new Error("该邮箱已注册");

    const userId = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    await createUser(userId, normalized, passwordHash, nickname);

    const token = signToken({ userId, email: normalized });
    return {
      token,
      user: { id: userId, email: normalized, nickname: nickname ?? null },
    };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await getUserByEmail(normalized);
    if (!user) throw new Error("邮箱或密码错误");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error("邮箱或密码错误");

    const token = signToken({ userId: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await getUserById(userId);
    if (!user) throw new Error("用户不存在");
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };
  }
}

export const authService = new AuthService();
