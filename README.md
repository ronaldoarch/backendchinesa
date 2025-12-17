# 🎰 BigBet777 - Backend API

Backend completo para plataforma de cassino online com integração PlayFivers.

**Repositório GitHub:** https://github.com/ronaldoarch/backendchiinesa2.git

---

## 🏗️ Arquitetura

```
Frontend (Hostinger) → Backend (VPS) → Banco (Railway PostgreSQL)
```

---

## 🚀 Deploy Rápido na VPS

### 1. Clonar repositório

```bash
git clone https://github.com/ronaldoarch/backendchiinesa2.git
cd backendchiinesa2
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar .env

```bash
cat > .env << 'EOF'
# Railway PostgreSQL
DATABASE_URL=postgresql://usuario:senha@host:porta/banco

# Servidor
PORT=4000
NODE_ENV=production

# PlayFivers
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD=bearer
PLAYFIVERS_AGENT_ID=agente03
PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-8d06d4b55f42
EOF
```

### 4. Iniciar com PM2

```bash
# Instalar PM2
npm install -g pm2 ts-node typescript

# Iniciar
pm2 start npx --name "cassino-api" -- ts-node server/index.ts

# Auto-start no boot
pm2 startup
pm2 save

# Ver status
pm2 status

# Ver logs
pm2 logs cassino-api
```

### 5. Abrir porta no firewall

```bash
# Ubuntu/Debian
ufw allow 4000

# CentOS/RHEL
firewall-cmd --add-port=4000/tcp --permanent
firewall-cmd --reload
```

---

## 🗄️ Railway PostgreSQL (Banco)

### 1. Criar projeto Railway

1. Acesse: https://railway.app
2. Login com GitHub
3. New Project → Provision PostgreSQL
4. Copie a **DATABASE_URL**

### 2. Configurar no .env

Cole a URL no `.env` da VPS:
```env
DATABASE_URL=postgresql://postgres:abc123@containers.railway.app:5432/railway
```

### 3. Tabelas são criadas automaticamente!

O servidor cria as tabelas no primeiro start.

---

## 📡 API Endpoints

### Principais:

```
GET  /api/health          - Health check
GET  /api/providers       - Listar provedores
POST /api/providers       - Criar provedor
GET  /api/games           - Listar jogos
POST /api/games           - Criar jogo
GET  /api/banners         - Listar banners
POST /api/banners         - Criar banner
GET  /api/settings        - Obter configurações
PUT  /api/settings        - Atualizar configurações
POST /api/uploads         - Upload de arquivo
```

Ver documentação completa: [API_DOCS.md](./API_DOCS.md)

---

## 🔧 Tecnologias

- **Node.js** 18+
- **Express** 4.x
- **TypeScript** 5.x
- **PostgreSQL** (Railway) ou **MySQL** (Hostinger)
- **Zod** - Validação
- **Multer** - Upload
- **Axios** - HTTP client
- **PM2** - Process manager

---

## 🎮 Integração PlayFivers

Configurar credenciais no `.env`:

```env
PLAYFIVERS_AGENT_ID=seu_id
PLAYFIVERS_AGENT_SECRET=seu_secret
PLAYFIVERS_AGENT_TOKEN=seu_token
```

Endpoint de sincronização:
```
POST /api/games/:id/sync-playfivers
```

---

## 📊 Banco de Dados

### PostgreSQL (Railway - Recomendado)

Tabelas criadas automaticamente:
- `providers` - Provedores de jogos
- `games` - Catálogo de jogos
- `banners` - Banners promocionais
- `settings` - Configurações

### MySQL (Hostinger)

Use o arquivo `database.sql` para criar as tabelas.

---

## 🔄 Atualizar Código

```bash
# Na VPS
cd ~/backendchiinesa2
git pull
pm2 restart cassino-api
```

---

## 🐛 Debug

```bash
# Ver logs
pm2 logs cassino-api

# Ver status
pm2 status

# Reiniciar
pm2 restart cassino-api

# Parar
pm2 stop cassino-api
```

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa.

---

## 📝 Licença

Privado - Todos os direitos reservados
