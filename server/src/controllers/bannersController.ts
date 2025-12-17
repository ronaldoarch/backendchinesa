import { Request, Response } from "express";
import { z } from "zod";
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner
} from "../services/bannersService";

const bannerSchema = z.object({
  title: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().default(true)
});

export async function listBannersController(_req: Request, res: Response): Promise<void> {
  const banners = await listBanners();
  res.json(banners);
}

export async function createBannerController(req: Request, res: Response): Promise<void> {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error.flatten());
    return;
  }

  const banner = await createBanner(parsed.data);
  res.status(201).json(banner);
}

export async function updateBannerController(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const parsed = bannerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error.flatten());
    return;
  }

  try {
    const updated = await updateBanner(id, parsed.data);
    if (!updated) {
      res.status(404).json({ message: "Banner não encontrado" });
      return;
    }
    res.json(updated);
  } catch (error: any) {
    if (error.message === "Nada para atualizar") {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function deleteBannerController(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const deleted = await deleteBanner(id);
  if (!deleted) {
    res.status(404).json({ message: "Banner não encontrado" });
    return;
  }

  res.status(204).send();
}



