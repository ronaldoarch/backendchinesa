import { Request, Response } from "express";
import { getUserVipData, VIP_LEVELS } from "../services/vipService";
import { asyncHandler } from "../middleware/errorHandler";

export async function getVipDataController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const vipData = await getUserVipData(userId);

    res.json({
      success: true,
      ...vipData,
      allLevels: VIP_LEVELS
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados VIP:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar dados VIP" });
  }
}
