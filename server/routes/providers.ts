import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const providersRouter = Router();

const providerSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  externalId: z.string().optional(),
  active: z.boolean().default(true)
});

providersRouter.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers ORDER BY id DESC"
  );
  res.json(rows);
});

providersRouter.post("/", async (req, res) => {
  const parsed = providerSchema.omit({ id: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const { name, externalId, active } = parsed.data;

  const [result] = await pool.query(
    "INSERT INTO providers (name, external_id, active) VALUES (?, ?, ?)",
    [name, externalId ?? null, active]
  );

  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
    [(result as any).insertId]
  );

  res.status(201).json((rows as any[])[0]);
});

providersRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const parsed = providerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (parsed.data.name !== undefined) {
    fields.push("name = ?");
    values.push(parsed.data.name);
  }
  if (parsed.data.externalId !== undefined) {
    fields.push("external_id = ?");
    values.push(parsed.data.externalId);
  }
  if (parsed.data.active !== undefined) {
    fields.push("active = ?");
    values.push(parsed.data.active);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nada para atualizar" });
  }

  values.push(id);

  const query = `UPDATE providers SET ${fields.join(", ")} WHERE id = ?`;

  const [result] = await pool.query(query, values);

  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ message: "Provider não encontrado" });
  }

  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
    [id]
  );

  res.json((rows as any[])[0]);
});

providersRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const [result] = await pool.query("DELETE FROM providers WHERE id = ?", [id]);

  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ message: "Provider não encontrado" });
  }

  res.status(204).send();
});


