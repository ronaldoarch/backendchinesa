import { Request, Response } from "express";
import {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} from "../services/promotionsService";

export async function listPromotionsController(req: Request, res: Response): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const promotions = await listPromotions(category);
    res.json(promotions);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao listar promoções:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getPromotionController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const promotion = await getPromotion(id);
    if (!promotion) {
      res.status(404).json({ error: "Promoção não encontrada" });
      return;
    }

    res.json(promotion);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao buscar promoção:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function createPromotionController(req: Request, res: Response): Promise<void> {
  try {
    const { title, subtitle, description, category, active, position } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ error: "Título é obrigatório" });
      return;
    }

    const promotion = await createPromotion({
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      description: description?.trim() || null,
      category: category || "eventos",
      active: active !== undefined ? Boolean(active) : true,
      position: position !== undefined ? Number(position) : 0
    });

    res.status(201).json(promotion);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao criar promoção:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updatePromotionController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const { title, subtitle, description, category, active, position } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle ? String(subtitle).trim() : null;
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (category !== undefined) updateData.category = String(category);
    if (active !== undefined) updateData.active = Boolean(active);
    if (position !== undefined) updateData.position = Number(position);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }

    const promotion = await updatePromotion(id, updateData);
    if (!promotion) {
      res.status(404).json({ error: "Promoção não encontrada" });
      return;
    }

    res.json(promotion);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao atualizar promoção:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function deletePromotionController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const deleted = await deletePromotion(id);
    if (!deleted) {
      res.status(404).json({ error: "Promoção não encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao deletar promoção:", error);
    res.status(500).json({ error: error.message });
  }
}
