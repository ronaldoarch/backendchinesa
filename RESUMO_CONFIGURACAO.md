# 📋 Resumo Rápido - Configuração

## 🏗️ Arquitetura

```
┌─────────────┐         ┌─────────────┐
│   Coolify   │         │   Railway   │
│             │         │             │
│  Backend    │────────▶│   MySQL     │
│  Node.js    │  Conecta │  Database   │
│             │         │             │
└─────────────┘         └─────────────┘
```

---

## ✅ O QUE VOCÊ JÁ TEM

- ✅ **MySQL criado no Railway**
- ✅ **Backend no Coolify**

---

## 🎯 O QUE FALTA FAZER

### 1️⃣ Copiar credenciais do Railway

**No Railway:**
- Serviço **MySQL** → Aba **"Variables"**
- Copie os valores (use ícone 👁️ para revelar senha):
  - `MYSQL_ROOT_PASSWORD` → Esta é a senha!
  - `MYSQL_DATABASE` → Geralmente `railway`
  - `MYSQLHOST` → Geralmente `hopper.proxy.rlwy.net`
  - `MYSQLPORT` → Geralmente `36793`

---

### 2️⃣ Adicionar variáveis no Coolify

**No Coolify:**
- Seu serviço **backend** → **"Environment Variables"**
- Adicione estas variáveis:

```
DB_HOST = hopper.proxy.rlwy.net
DB_PORT = 36793
DB_USER = root
DB_PASSWORD = (cole a senha do Railway aqui)
DB_NAME = railway
PORT = 4000
PLAYFIVERS_BASE_URL = https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD = bearer
PLAYFIVERS_AGENT_ID = agente03
PLAYFIVERS_AGENT_SECRET = fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN = 977bbb3e-98fb-4718-aad6-8d06d4b55f42
```

---

### 3️⃣ Reiniciar backend no Coolify

- Clique em **"Redeploy"** ou **"Restart"**
- Aguarde o deploy
- Veja os logs → Deve aparecer: `✅ Banco de dados MySQL conectado`

---

## 📚 Guias Completos

- **Configuração Coolify:** [COOLIFY_SETUP.md](./COOLIFY_SETUP.md)
- **Informações Railway MySQL:** [RAILWAY_MYSQL_SETUP.md](./RAILWAY_MYSQL_SETUP.md)

---

## ⚠️ IMPORTANTE

- **Railway** = Apenas banco MySQL (você já tem)
- **Coolify** = Backend Node.js (você já tem)
- **Precisa conectar:** Backend (Coolify) → MySQL (Railway)

**O problema:** Backend precisa das variáveis de conexão para encontrar o banco!

---

## 🆘 Problema Comum

### "Não tem Node no Railway"

**Resposta:** Correto! Node está no **Coolify**, não no Railway.

- Railway = MySQL (banco)
- Coolify = Node.js (backend)

Você precisa adicionar as variáveis no **Coolify**, não no Railway!

---

**👉 Próximo passo:** Abra [COOLIFY_SETUP.md](./COOLIFY_SETUP.md) e siga o passo a passo! 🚀

