import { Request, Response } from "express";
import { z } from "zod";
import {
  listBonuses,
  createBonus,
  updateBonus,
  deleteBonus
} from "../services/bonusService";
import { asyncHandler } from "../middleware/asyncHandler";

const createBonusSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["first_deposit", "deposit", "vip_level", "custom"]),
  bonusPercentage: z.number().min(0).optional().default(0),
  bonusFixed: z.number().min(0).optional().default(0),
  minDeposit: z.number().min(0).optional().default(0),
  maxBonus: z.number().min(0).nullable().optional(),
  rolloverMultiplier: z.number().min(0).optional().default(1),
  rtpPercentage: z.number().min(0).max(100).optional().default(96),
  vipLevelRequired: z.number().int().min(0).nullable().optional(),
  active: z.boolean().optional().default(true)
});

const updateBonusSchema = createBonusSchema.partial();

export async function listBonusesController(req: Request, res: Response): Promise<void> {
  try {
    const bonuses = await listBonuses();
    res.json(bonuses);
  } catch (error: any) {
    console.error("Erro ao listar bônus:", error);
    res.status(500).json({
      error: error.message || "Erro ao listar bônus"
    });
  }
}

export async function createBonusController(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createBonusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten()
      });
      return;
    }

    const bonus = await createBonus(parsed.data);
    res.status(201).json(bonus);
  } catch (error: any) {
    console.error("Erro ao criar bônus:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar bônus"
    });
  }
}

export async function updateBonusController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const parsed = updateBonusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten()
      });
      return;
    }

    const bonus = await updateBonus(id, parsed.data);
    if (!bonus) {
      res.status(404).json({ error: "Bônus não encontrado" });
      return;
    }

    res.json(bonus);
  } catch (error: any) {
    console.error("Erro ao atualizar bônus:", error);
    res.status(500).json({
      error: error.message || "Erro ao atualizar bônus"
    });
  }
}

export async function deleteBonusController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    await deleteBonus(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar bônus:", error);
    res.status(500).json({
      error: error.message || "Erro ao deletar bônus"
    });
  }
}

export const bonusController = {
  listBonuses: asyncHandler(listBonusesController),
  createBonus: asyncHandler(createBonusController),
  updateBonus: asyncHandler(updateBonusController),
  deleteBonus: asyncHandler(deleteBonusController)
};
