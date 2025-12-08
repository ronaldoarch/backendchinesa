import { Router } from "express";
import { providersRouter } from "./providers";
import { gamesRouter } from "./games";
import { bannersRouter } from "./banners";
import { settingsRouter } from "./settings";
import { uploadsRouter } from "./uploads";
import { playfiversRouter } from "./playfivers";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.post("/playfivers/callback", (req, res) => {
  // eslint-disable-next-line no-console
  console.log("Callback PlayFivers recebido:", req.body);
  res.status(200).json({ ok: true });
});

apiRouter.use("/providers", providersRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/banners", bannersRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/playfivers", playfiversRouter);

