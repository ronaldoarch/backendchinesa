import { Request, Response } from "express";
import { z } from "zod";
import { getSettings, upsertSetting } from "../services/settingsService";

const settingSchema = z.object({
  key: z.string(),
  value: z.string()
});

export async function listSettingsController(_req: Request, res: Response) {
  const settings = await getSettings();
  res.json(settings);
}

export async function upsertSettingsController(req: Request, res: Response) {
  const parsed = z.array(settingSchema).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  await Promise.all(parsed.data.map((item) => upsertSetting(item.key, item.value)));
  res.json({ ok: true });
}

