# 🎰 BigBet777 - Backend API

Backend completo para plataforma de cassino online com integração PlayFivers.

## 🚀 Deploy Rápido

### Railway (Banco de Dados)
1. Criar projeto no Railway
2. Provision PostgreSQL
3. Copiar DATABASE_URL

### VPS (Servidor)
```bash
git clone https://github.com/ronaldoarch/backendchinesa.git
cd backendchinesa
npm install
```

Criar `.env`:
```env
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=4000
NODE_ENV=production
PLAYFIVERS_AGENT_ID=seu_id
PLAYFIVERS_AGENT_SECRET=seu_secret
PLAYFIVERS_AGENT_TOKEN=seu_token
```

Iniciar:
```bash
npm install -g pm2
pm2 start npx --name "cassino-api" -- ts-node server/index.ts
pm2 startup
pm2 save
```

## 📡 API Endpoints

- `GET /api/health` - Health check
- `GET /api/providers` - Listar provedores
- `GET /api/games` - Listar jogos
- `GET /api/banners` - Listar banners
- `GET /api/settings` - Configurações

Ver documentação completa em `API_DOCS.md`

## 🔧 Tecnologias

- Node.js 18+
- Express
- TypeScript
- PostgreSQL
- Zod (validação)
- Multer (uploads)

## 📝 Licença

Privado - Todos os direitos reservados


