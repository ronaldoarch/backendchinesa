import { Request, Response } from "express";
import { z } from "zod";
import {
  createProvider,
  deleteProvider,
  listProviders,
  updateProvider
} from "../services/providersService";

const providerSchema = z.object({
  name: z.string(),
  externalId: z.string().optional(),
  active: z.boolean().default(true)
});

export async function listProvidersController(_req: Request, res: Response) {
  const providers = await listProviders();
  res.json(providers);
}

export async function createProviderController(req: Request, res: Response) {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const provider = await createProvider(parsed.data);
  res.status(201).json(provider);
}

export async function updateProviderController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const parsed = providerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  try {
    const updated = await updateProvider(id, parsed.data);
    if (!updated) {
      return res.status(404).json({ message: "Provider não encontrado" });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.message === "Nada para atualizar") {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

export async function deleteProviderController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const deleted = await deleteProvider(id);
  if (!deleted) {
    return res.status(404).json({ message: "Provider não encontrado" });
  }

  res.status(204).send();
}

