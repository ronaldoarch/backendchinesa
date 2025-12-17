import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";

export const settingsRouter = Router();

const settingsUpdateSchema = z.record(z.string());

interface SettingRow extends RowDataPacket {
  key: string;
  value: string;
}

settingsRouter.get("/", async (_req, res) => {
  const [rows] = await pool.query<SettingRow[]>(
    "SELECT `key`, `value` FROM settings"
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  res.json(map);
});

settingsRouter.put("/", async (req, res) => {
  const parsed = settingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const entries = Object.entries(parsed.data);
  if (entries.length === 0) {
    return res.status(400).json({ message: "Nenhuma configuração enviada" });
  }

  for (const [key, value] of entries) {
    await pool.query(
      `INSERT INTO settings (\`key\`, \`value\`)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = ?`,
      [key, value, value]
    );
  }

  res.status(204).send();
});
