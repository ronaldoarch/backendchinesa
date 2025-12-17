import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const bannersRouter = Router();

const bannerSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true)
});

bannersRouter.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id,
            title,
            image_url AS imageUrl,
            link_url AS linkUrl,
            position,
            active
       FROM banners
   ORDER BY position ASC, id DESC`
  );
  res.json(rows);
});

bannersRouter.post("/", async (req, res) => {
  const parsed = bannerSchema.omit({ id: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const { title, imageUrl, linkUrl, position, active } = parsed.data;

  const [result] = await pool.query(
    `INSERT INTO banners (title, image_url, link_url, position, active)
     VALUES (?, ?, ?, ?, ?)`,
    [title, imageUrl, linkUrl ?? null, position, active]
  );

  const [rows] = await pool.query(
    `SELECT id, title, image_url AS imageUrl, link_url AS linkUrl, position, active
     FROM banners WHERE id = ?`,
    [(result as any).insertId]
  );

  res.status(201).json((rows as any[])[0]);
});

bannersRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const [result] = await pool.query("DELETE FROM banners WHERE id = ?", [id]);

  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ message: "Banner não encontrado" });
  }

  res.status(204).send();
});
