import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type Setting = {
  key: string;
  value: string;
};

export async function getSettings(): Promise<Setting[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT `key`, `value` FROM settings");
  return rows as unknown as Setting[];
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await pool.query(
    "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, value]
  );
}




