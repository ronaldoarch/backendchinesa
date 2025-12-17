# 🔄 Atualizar Servidor - Servir Frontend pelo Node.js

## 📋 O QUE MUDOU

Atualizei o `server/index.ts` para que o Node.js sirva o frontend também!

**Vantagens:**
- ✅ Não precisa do .htaccess funcionando
- ✅ Tudo roda na porta 4000
- ✅ Mais simples de configurar

---

## 📝 ATUALIZAR O ARQUIVO NO SERVIDOR

### No SSH da Hostinger:

```bash
# Ir para a pasta do servidor
cd ~/cassino-backend/server

# Fazer backup do arquivo atual
cp index.ts index.ts.backup

# Editar o arquivo
nano index.ts
```

### Substituir o conteúdo por este:

```typescript
import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import { providersRouter } from "./routes/providers";
import { gamesRouter } from "./routes/games";
import { bannersRouter } from "./routes/banners";
import { settingsRouter } from "./routes/settings";
import { uploadsRouter } from "./routes/uploads";
import { initDb } from "./db";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);
app.use(json());

const uploadsDir = path.resolve(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Servir arquivos estáticos do frontend
const frontendDir = path.resolve(__dirname, "..", "public_html");
app.use(express.static(frontendDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/playfivers/callback", (req, res) => {
  console.log("Callback PlayFivers recebido:", req.body);
  res.status(200).json({ ok: true });
});

app.use("/api/providers", providersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/uploads", uploadsRouter);

// Servir index.html para todas as outras rotas (SPA)
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

const port = process.env.PORT || 4000;

void initDb().then(() => {
  app.listen(port, () => {
    console.log(`Servidor API rodando na porta ${port}`);
  });
});
```

Salvar: `Ctrl+X`, `Y`, `Enter`

---

## 🔄 REINICIAR O SERVIDOR

```bash
# Reiniciar PM2
pm2 restart cassino-api

# Ver logs
pm2 logs cassino-api --lines 20
```

---

## 🧪 TESTAR

Agora acesse direto pela porta 4000:

```
http://212.85.6.24:4000
http://212.85.6.24:4000/api/health
http://212.85.6.24:4000/api/games
```

---

## 🎯 ALTERNATIVA RÁPIDA

Se quiser testar antes de editar, execute no SSH:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/games
```

Se esses funcionarem, o servidor está OK! Só falta o proxy/redirecionamento.

---

**Me mostre o resultado do curl no servidor SSH!** 🔍


