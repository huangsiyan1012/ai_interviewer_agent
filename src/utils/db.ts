// backend/src/utils/db.ts
import mysql from "mysql2/promise";
import config from "../config/config";

// 创建连接池
const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  charset: config.mysql.charset,
  waitForConnections: true,
  connectionLimit: config.mysql.connectionLimit,
  queueLimit: 0,
});

/**
 * 执行 SQL 查询
 */
export const query = async (sql: string, params?: any[]) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

/**
 * 获取单条记录
 */
export const queryOne = async (sql: string, params?: any[]) => {
  const [results] = await pool.execute(sql, params);
  const rows = results as any[];
  return rows.length > 0 ? rows[0] : null;
};

/**
 * 执行插入操作，返回插入 ID
 */
export const insert = async (sql: string, params?: any[]) => {
  const [result] = await pool.execute(sql, params);
  return (result as any).insertId;
};

/**
 * 执行更新操作，返回受影响行数
 */
export const update = async (sql: string, params?: any[]) => {
  const [result] = await pool.execute(sql, params);
  return (result as any).affectedRows;
};

/**
 * 获取数据库连接（用于事务）
 */
export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;
