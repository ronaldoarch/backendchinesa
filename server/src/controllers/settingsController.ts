import { Request, Response } from "express";
import { z } from "zod";
import { getSettings, upsertSetting } from "../services/settingsService";

const settingsObjectSchema = z.record(z.string(), z.string());

export async function listSettingsController(_req: Request, res: Response): Promise<void> {
  const settings = await getSettings();
  // Converter array para objeto Record<string, string>
  const settingsObject: Record<string, string> = {};
  for (const setting of settings) {
    settingsObject[setting.key] = setting.value;
  }
  res.json(settingsObject);
}

export async function upsertSettingsController(req: Request, res: Response): Promise<void> {
  const parsed = settingsObjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error.flatten());
    return;
  }

  await Promise.all(
    Object.entries(parsed.data).map(([key, value]) => upsertSetting(key, value))
  );
  res.json({ ok: true });
}



