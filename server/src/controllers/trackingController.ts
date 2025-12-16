import { Request, Response } from "express";
import { z } from "zod";
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook
} from "../services/trackingService";
import { asyncHandler } from "../middleware/asyncHandler";

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  enabled: z.boolean().optional().default(true)
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  enabled: z.boolean().optional()
});

export async function listWebhooksController(req: Request, res: Response): Promise<void> {
  try {
    const webhooks = await listWebhooks();
    res.json(webhooks);
  } catch (error: any) {
    console.error("Erro ao listar webhooks:", error);
    res.status(500).json({
      error: error.message || "Erro ao listar webhooks"
    });
  }
}

export async function createWebhookController(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten()
      });
      return;
    }

    const webhook = await createWebhook(parsed.data);
    res.status(201).json(webhook);
  } catch (error: any) {
    console.error("Erro ao criar webhook:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar webhook"
    });
  }
}

export async function updateWebhookController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const parsed = updateWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.flatten()
      });
      return;
    }

    const webhook = await updateWebhook(id, parsed.data);
    if (!webhook) {
      res.status(404).json({ error: "Webhook não encontrado" });
      return;
    }

    res.json(webhook);
  } catch (error: any) {
    console.error("Erro ao atualizar webhook:", error);
    res.status(500).json({
      error: error.message || "Erro ao atualizar webhook"
    });
  }
}

export async function deleteWebhookController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    await deleteWebhook(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar webhook:", error);
    res.status(500).json({
      error: error.message || "Erro ao deletar webhook"
    });
  }
}

export const trackingController = {
  listWebhooks: asyncHandler(listWebhooksController),
  createWebhook: asyncHandler(createWebhookController),
  updateWebhook: asyncHandler(updateWebhookController),
  deleteWebhook: asyncHandler(deleteWebhookController)
};
