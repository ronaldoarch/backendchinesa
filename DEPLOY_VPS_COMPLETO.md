# 🚀 Deploy Completo: VPS + Railway + Hostinger

## ✅ BACKEND JÁ ESTÁ NO GITHUB!

**Repositório:** https://github.com/ronaldoarch/backendchinesa.git

---

## 📋 PASSO 1: Configurar Railway (5 minutos)

### 1.1. Criar conta

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"**
3. Login com **GitHub** (use a mesma conta: ronaldoarch)

### 1.2. Criar banco PostgreSQL

1. Clique em **"New Project"**
2. Selecione **"Provision PostgreSQL"**
3. Aguarde 1-2 minutos

### 1.3. Obter DATABASE_URL

1. Clique no card **"PostgreSQL"**
2. Vá na aba **"Connect"**
3. Copie a **"Postgres Connection URL"**

Exemplo:
```
postgresql://postgres:abcd1234@containers-us-west-123.railway.app:5432/railway
```

**Guarde essa URL!** Vai usar na VPS.

✅ **Railway configurado!**

---

## 📋 PASSO 2: Configurar VPS (15 minutos)

### 2.1. Escolher e criar VPS

**Opções recomendadas:**

#### A) Oracle Cloud (GRÁTIS SEMPRE!)
- **Custo:** $0 (always free)
- **Recursos:** 1GB RAM, 1 CPU, 10GB SSD
- **Link:** https://cloud.oracle.com
- ✅ **Melhor opção grátis!**

#### B) DigitalOcean
- **Custo:** $4/mês
- **Recursos:** 512MB RAM, 1 CPU, 10GB SSD
- **Link:** https://digitalocean.com
- ✅ Mais simples

#### C) Vultr
- **Custo:** $2.50/mês
- **Recursos:** 512MB RAM, 1 CPU, 10GB SSD
- **Link:** https://vultr.com

### 2.2. Conectar na VPS

```bash
ssh root@IP_DA_SUA_VPS
```

### 2.3. Instalar Node.js

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git

# Verificar
node --version
npm --version
```

### 2.4. Clonar repositório

```bash
# Ir para home
cd ~

# Clonar do GitHub
git clone https://github.com/ronaldoarch/backendchinesa.git

# Entrar na pasta
cd backendchinesa
```

### 2.5. Instalar dependências

```bash
npm install
npm install -g pm2 ts-node typescript
```

### 2.6. Criar .env

```bash
cat > .env << 'EOF'
# Railway PostgreSQL (cole sua URL aqui)
DATABASE_URL=postgresql://postgres:senha@host:5432/railway

# Servidor
PORT=4000
NODE_ENV=production

# CORS (IP da Hostinger)
FRONTEND_URL=http://212.85.6.24

# PlayFivers
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD=bearer
PLAYFIVERS_AGENT_ID=agente03
PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-8d06d4b55f42
EOF

# IMPORTANTE: Editar e colocar a DATABASE_URL do Railway!
nano .env
```

### 2.7. Criar pasta de uploads

```bash
mkdir -p server/uploads
```

### 2.8. Iniciar com PM2

```bash
# Iniciar
pm2 start npx --name "cassino-api" -- ts-node server/index.ts

# Auto-start no reboot
pm2 startup
# Execute o comando que aparecer
pm2 save

# Ver status
pm2 status

# Ver logs
pm2 logs cassino-api --lines 20
```

### 2.9. Abrir porta 4000

```bash
# Ubuntu/Debian
ufw allow 4000
ufw enable

# Verificar
ufw status
```

✅ **Backend na VPS configurado!**

---

## 📋 PASSO 3: Atualizar Frontend (5 minutos)

### 3.1. No seu Mac, criar .env.production

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa

# Criar arquivo
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://IP_DA_SUA_VPS:4000/api
EOF
```

**IMPORTANTE:** Substitua `IP_DA_SUA_VPS` pelo IP real!

### 3.2. Build do frontend

```bash
npm run build:client
```

### 3.3. Upload para Hostinger

```bash
scp -P 65002 -r dist-client/* u127271520@212.85.6.24:~/public_html/
```

✅ **Frontend atualizado!**

---

## 🧪 PASSO 4: Testar Tudo

### 4.1. Testar Backend (VPS)

No navegador:
```
http://IP_VPS:4000/api/health
http://IP_VPS:4000/api/games
http://IP_VPS:4000/api/providers
```

Deve retornar JSON!

### 4.2. Testar Frontend (Hostinger)

```
http://212.85.6.24
http://212.85.6.24/admin
```

Deve mostrar o site e os jogos carregarem da VPS!

---

## 📊 RESUMO

| Componente | Onde | URL | Status |
|-----------|------|-----|--------|
| Frontend | Hostinger | http://212.85.6.24 | ✅ |
| Backend | VPS | http://IP_VPS:4000 | ⏳ |
| Banco | Railway | PostgreSQL | ⏳ |
| GitHub | Código | github.com/ronaldoarch/backendchinesa | ✅ |

---

## 🔄 Atualizações Futuras

### Na VPS:
```bash
cd ~/backendchinesa
git pull
pm2 restart cassino-api
```

### No Frontend:
```bash
# No Mac
npm run build:client
scp -P 65002 -r dist-client/* u127271520@212.85.6.24:~/public_html/
```

---

## 💰 CUSTOS MENSAIS

- **Railway:** $0 (plano grátis - 10GB)
- **VPS Oracle:** $0 (always free)
- **Hostinger:** Já pago
- **GitHub:** $0

**Total: GRÁTIS!** 🎉

---

## 📝 CHECKLIST

- [x] Backend no GitHub
- [ ] Criar projeto no Railway
- [ ] Copiar DATABASE_URL
- [ ] Criar VPS (Oracle/DO/Vultr)
- [ ] Instalar Node.js na VPS
- [ ] Clonar repositório
- [ ] Configurar .env
- [ ] Iniciar PM2
- [ ] Abrir porta 4000
- [ ] Atualizar frontend
- [ ] Testar tudo

---

## 🎯 PRÓXIMO PASSO

**Criar conta no Railway:** https://railway.app

Depois me avise que te ajudo com a VPS! 🚀


