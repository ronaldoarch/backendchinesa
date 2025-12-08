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

export async function listBannersController(_req: Request, res: Response) {
  const banners = await listBanners();
  res.json(banners);
}

export async function createBannerController(req: Request, res: Response) {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const banner = await createBanner(parsed.data);
  res.status(201).json(banner);
}

export async function updateBannerController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const parsed = bannerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  try {
    const updated = await updateBanner(id, parsed.data);
    if (!updated) {
      return res.status(404).json({ message: "Banner não encontrado" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.message === "Nada para atualizar") {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

export async function deleteBannerController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const deleted = await deleteBanner(id);
  if (!deleted) {
    return res.status(404).json({ message: "Banner não encontrado" });
  }

  res.status(204).send();
}

