import { Request, Response } from "express";
import {
  getReferralLink,
  getReferralStats,
  trackReferralBet
} from "../services/referralService";
import { env } from "../config/env";

export async function getReferralLinkController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const baseUrl = env.frontendUrl || process.env.APP_URL || "https://h2jogos.site";
    const link = await getReferralLink(userId, baseUrl);
    const code = link.split("ref=")[1] || "";

    res.json({
      referralCode: code,
      referralLink: link
    });
  } catch (error: any) {
    console.error("Erro ao obter link de indicação:", error);
    res.status(500).json({ error: error.message || "Erro ao obter link de indicação" });
  }
}

export async function getReferralStatsController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const stats = await getReferralStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error("Erro ao obter estatísticas de indicação:", error);
    res.status(500).json({ error: error.message || "Erro ao obter estatísticas" });
  }
}

export async function trackBetController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const { betAmount } = req.body;
    
    if (!betAmount || typeof betAmount !== "number" || betAmount <= 0) {
      res.status(400).json({ error: "Valor da aposta inválido" });
      return;
    }

    // Rastrear aposta (não bloqueia se não houver referência)
    await trackReferralBet(userId, betAmount);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao rastrear aposta:", error);
    res.status(500).json({ error: error.message || "Erro ao rastrear aposta" });
  }
}
