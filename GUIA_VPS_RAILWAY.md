# 🚀 Guia Completo: Deploy Backend na VPS

## ✅ PRÉ-REQUISITOS

- [x] Railway MySQL criado
- [x] Credenciais do Railway obtidas
- [x] Backend no GitHub
- [ ] VPS criada

---

## 📋 PASSO 1: CRIAR VPS (15 minutos)

### Opção A: Oracle Cloud (GRÁTIS SEMPRE) ⭐

1. **Criar conta:** https://cloud.oracle.com
2. **Criar VM:**
   - Compute → Instances → Create Instance
   - Image: Ubuntu 22.04
   - Shape: VM.Standard.E2.1.Micro (Always Free)
   - Criar
3. **Anotar IP público** (ex: 150.230.45.67)
4. **Download da chave SSH** (se pediu)

### Opção B: DigitalOcean ($4/mês)

1. Criar conta: https://digitalocean.com
2. Create → Droplets
3. Ubuntu 22.04, Basic, $4/mês
4. Anotar IP

### Opção C: Vultr ($2.50/mês)

1. Criar conta: https://vultr.com
2. Deploy New Server
3. Cloud Compute, Ubuntu, $2.50/mês
4. Anotar IP

---

## 📋 PASSO 2: CONECTAR NA VPS

```bash
# Se usou Oracle (com chave SSH)
ssh -i caminho/para/chave.pem ubuntu@IP_VPS

# Outros (com senha)
ssh root@IP_VPS
```

---

## 📋 PASSO 3: CONFIGURAR VPS

### 3.1. Atualizar sistema

```bash
apt update && apt upgrade -y
```

### 3.2. Instalar Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git
```

### 3.3. Verificar instalação

```bash
node --version  # Deve mostrar v18.x
npm --version   # Deve mostrar v10.x
```

---

## 📋 PASSO 4: CLONAR REPOSITÓRIO

```bash
# Ir para home
cd ~

# Clonar do GitHub
git clone https://github.com/ronaldoarch/backendchinesa.git

# Entrar na pasta
cd backendchinesa

# Ver arquivos
ls -la
```

---

## 📋 PASSO 5: INSTALAR DEPENDÊNCIAS

```bash
npm install
npm install -g pm2 ts-node typescript
```

---

## 📋 PASSO 6: CONFIGURAR .ENV

```bash
cat > .env << 'EOF'
# Railway MySQL
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=36793
DB_USER=root
DB_PASSWORD=KZJnoxPuPqJOSlTIsecwcJYnySdOICAU
DB_NAME=railway

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

---

## 📋 PASSO 7: CRIAR PASTA DE UPLOADS

```bash
mkdir -p server/uploads
```

---

## 📋 PASSO 8: INICIAR BACKEND

```bash
# Iniciar com PM2
pm2 start npx --name "cassino-api" -- ts-node server/index.ts

# Ver logs
pm2 logs cassino-api --lines 30

# Ver status
pm2 status
```

**Resultado esperado:**
```
✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!
✅ Servidor API rodando na porta 4000
```

---

## 📋 PASSO 9: AUTO-START NO BOOT

```bash
# Configurar para iniciar automaticamente
pm2 startup

# Execute o comando que aparecer (algo como):
# sudo env PATH=$PATH:... pm2 startup systemd -u root --hp /root

# Salvar configuração
pm2 save
```

---

## 📋 PASSO 10: ABRIR PORTA 4000

```bash
# Ubuntu/Debian (UFW)
ufw allow 4000
ufw allow 22
ufw enable
ufw status

# Se for Oracle Cloud, também precisa abrir no painel:
# Networking → Virtual Cloud Networks → Security Lists
# Add Ingress Rule: Port 4000, Source 0.0.0.0/0
```

---

## 🧪 PASSO 11: TESTAR

### Na própria VPS:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/games
```

### Do seu Mac/Navegador:

```
http://IP_VPS:4000/api/health
http://IP_VPS:4000/api/games
```

**Deve retornar JSON com os dados!**

---

## 📋 PASSO 12: ATUALIZAR FRONTEND

### No seu Mac:

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa

# Criar .env.production
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://IP_DA_VPS:4000/api
EOF

# IMPORTANTE: Substitua IP_DA_VPS pelo IP real!
nano .env.production

# Build
npm run build:client

# Upload para Hostinger
scp -P 65002 -r dist-client/* u127271520@212.85.6.24:~/public_html/
```

---

## ✅ RESULTADO FINAL

```
Frontend:  http://212.85.6.24 (Hostinger)
     ↓
Backend:   http://IP_VPS:4000 (sua VPS)
     ↓
Banco:     Railway MySQL (hopper.proxy.rlwy.net)
```

---

## 🎯 PRÓXIMO PASSO

**Criar a VPS!**

Recomendo **Oracle Cloud Always Free**: https://cloud.oracle.com

Me avise quando criar e me dê o IP que te ajudo com o resto! 🚀

---

## 📝 RESUMO DOS ARQUIVOS CRIADOS

- ✅ **GitHub:** https://github.com/ronaldoarch/backendchinesa
- ✅ **.env.vps** - Configuração pronta (no seu Mac)
- ✅ **GUIA_VPS_RAILWAY.md** - Este guia
- ✅ **RAILWAY_MYSQL_SETUP.md** - Setup Railway

**Tudo pronto! Só falta criar a VPS! 💪**
