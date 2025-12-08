# ⚡ EXECUTE ESTES COMANDOS - Preparar para Hostinger

## 🎯 COMANDOS PARA EXECUTAR AGORA

Copie e cole cada comando no terminal:

### 1. Entre na pasta do projeto
```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
```

### 2. Instale o MySQL2
```bash
npm install mysql2
```

### 3. Faça o build completo
```bash
npm run build
```

---

## ✅ PRONTO!

Agora você tem 2 pastas prontas para upload:

### 📁 `dist-client/` 
**→ Conteúdo vai para `public_html/` na Hostinger**

### 📁 `dist-server/`
**→ Vai para uma pasta separada (ex: `cassino-backend/`) na Hostinger**

---

## 📤 PRÓXIMO PASSO: UPLOAD

### Via File Manager (cPanel):

1. **Frontend:**
   - Acesse `public_html/`
   - Delete tudo (se for site novo)
   - Upload de **TUDO** dentro de `dist-client/`
   - Upload do arquivo `.htaccess`

2. **Backend:**
   - Crie pasta `cassino-backend/`
   - Upload da pasta `dist-server/`
   - Upload da pasta `node_modules/`
   - Upload do `package.json`

---

## 🗄️ MYSQL NA HOSTINGER

No cPanel → Bancos de dados MySQL:

1. **Criar banco:** `chinesa`
2. **Criar usuário:** `chinesa_user` + senha forte
3. **Vincular:** usuário ao banco (todos privilégios)
4. **Anotar:** host, banco, usuário, senha

---

## ⚙️ NODE.JS NA HOSTINGER

No cPanel → Setup Node.js App:

1. **Create Application**
2. **Node.js:** 18.x
3. **Root:** `/home/usuario/cassino-backend`
4. **Startup:** `dist-server/index.js`
5. **Adicionar variáveis de ambiente:**
   - `DB_HOST` = `localhost`
   - `DB_USER` = `seu_usuario`
   - `DB_PASSWORD` = `sua_senha`
   - `DB_NAME` = `seu_banco`
   - `PORT` = `4000`
   - `NODE_ENV` = `production`
6. **Run NPM Install**
7. **Start**

---

## ✅ TESTAR

- Frontend: `https://seudominio.com`
- API: `https://seudominio.com/api/health`
- Admin: `https://seudominio.com/admin`

---

## 🔒 SSL (HTTPS)

cPanel → SSL/TLS Status → Run AutoSSL

---

## 📚 PRECISA DE AJUDA?

Leia: **UPLOAD_HOSTINGER_SIMPLES.md**

Guia completo passo a passo!

---

## 🎉 É ISSO!

Três comandos localmente + upload na Hostinger = **PRONTO!** 🚀

