# 🚀 Deploy: Frontend (Hostinger) + Backend (VPS) + Banco (Railway)

## 🏗️ Arquitetura Final

```
┌─────────────────┐      HTTPS      ┌─────────────┐      PostgreSQL    ┌──────────┐
│   Frontend      │ ──────────────> │   Backend   │ ─────────────────> │ Railway  │
│   (Hostinger)   │                 │    (VPS)    │                    │  (Banco) │
│   212.85.6.24   │                 │ Sua VPS IP  │                    │   Free   │
└─────────────────┘                 └─────────────┘                    └──────────┘
     Port 80                             Port 4000                      PostgreSQL
```

---

## 📋 PASSO 1: Configurar Railway (Banco de Dados)

### 1.1. Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"**
3. Login com GitHub (recomendado)

### 1.2. Criar banco PostgreSQL

1. Clique em **"New Project"**
2. Selecione **"Provision PostgreSQL"**
3. Aguarde a criação (1-2 minutos)

### 1.3. Obter URL de conexão

1. Clique no serviço **PostgreSQL**
2. Vá na aba **"Connect"**
3. Copie a **"Postgres Connection URL"**
4. Formato: `postgresql://usuario:senha@host:porta/banco`

Exemplo:
```
postgresql://postgres:abc123@containers-us-west-1.railway.app:5432/railway
```

### 1.4. Inserir dados iniciais (opcional)

1. Na aba **"Data"** do Railway
2. Clique em **"Query"**
3. Cole e execute este SQL:

```sql
-- Inserir provedores
INSERT INTO providers (name, external_id, active) VALUES
('PG Soft', 'pg_soft', true),
('Pragmatic Play', 'pragmatic', true),
('Evolution Gaming', 'evolution', true);

-- Inserir jogos
INSERT INTO games (provider_id, name, external_id, active) VALUES
(1, 'Fortune Tiger', 'fortune_tiger', true),
(1, 'Fortune Ox', 'fortune_ox', true),
(1, 'Fortune Mouse', 'fortune_mouse', true),
(2, 'Gates of Olympus', 'gates_olympus', true),
(2, 'Sweet Bonanza', 'sweet_bonanza', true);
```

**Ou** deixe que o servidor crie automaticamente!

---

## 📋 PASSO 2: Configurar VPS (Backend)

### 2.1. Qual VPS usar?

**Recomendações (grátis/baratas):**
- ✅ **Oracle Cloud** - Always Free (1GB RAM)
- ✅ **Google Cloud** - $300 crédito grátis
- ✅ **AWS Lightsail** - $3.50/mês
- ✅ **DigitalOcean** - $4/mês
- ✅ **Vultr** - $2.50/mês

### 2.2. Configurar VPS

Após criar a VPS, conecte via SSH:

```bash
ssh root@IP_DA_SUA_VPS
```

### 2.3. Instalar Node.js na VPS

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar
node --version
npm --version

# Instalar PM2
npm install -g pm2
```

### 2.4. Upload do backend para VPS

**No seu Mac:**

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa

# Upload via SCP
scp -r server package.json root@IP_VPS:~/cassino-backend/
```

### 2.5. Configurar .env na VPS

**No SSH da VPS:**

```bash
cd ~/cassino-backend

# Criar .env
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

# Instalar dependências
npm install

# Instalar ts-node
npm install -g ts-node typescript

# Iniciar com PM2
pm2 start npx --name "cassino-api" -- ts-node server/index.ts

# Salvar para auto-start
pm2 startup
pm2 save
```

### 2.6. Abrir porta 4000 no firewall

```bash
# Ubuntu/Debian
ufw allow 4000

# Verificar
ufw status
```

---

## 📋 PASSO 3: Atualizar Frontend (Hostinger)

### 3.1. Criar arquivo .env.production local

No seu Mac, crie:

```bash
# No projeto local
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://IP_DA_SUA_VPS:4000/api
EOF
```

**Substitua `IP_DA_SUA_VPS` pelo IP real!**

### 3.2. Build do frontend

```bash
npm run build:client
```

### 3.3. Upload para Hostinger

```bash
scp -P 65002 -r dist-client/* u127271520@212.85.6.24:~/public_html/
```

---

## 📋 PASSO 4: Testar Tudo

### No navegador:

```
Frontend: http://212.85.6.24
Backend API: http://IP_VPS:4000/api/health
Admin: http://212.85.6.24/admin
```

---

## 💰 CUSTOS

- **Railway:** Grátis (10GB, $5 crédito/mês)
- **VPS:** $0 a $5/mês (dependendo)
- **Hostinger:** Você já tem!

**Total: Grátis ou ~$5/mês**

---

## 🎯 RESUMO

| Componente | Onde | Por quê |
|-----------|------|---------|
| Frontend | Hostinger | Já está funcionando, estável |
| Backend | VPS | Node.js nativo, sem limitações |
| Banco | Railway | PostgreSQL grátis, fácil |

---

## ✅ QUER QUE EU PREPARE TUDO?

Vou criar:
1. ✅ Reverter código para PostgreSQL
2. ✅ Guia completo de Railway
3. ✅ Guia completo de VPS
4. ✅ Scripts de deploy
5. ✅ Configuração do frontend

**Confirma que quer seguir esse caminho? É a melhor solução! 🚀**

