import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import { env } from "./config/env";
import { initDb } from "./config/database";
import { apiRouter } from "./routes";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);
app.use(json());
app.use(requestLogger);

const uploadsDir = path.resolve(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Servir arquivos estáticos do frontend (public_html)
const frontendDir = path.resolve(__dirname, "..", "public_html");
app.use(express.static(frontendDir));

app.use("/api", apiRouter);

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use(errorHandler);

void initDb().then(() => {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor API rodando na porta ${env.port}`);
  });
});

