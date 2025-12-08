# 🔧 Ajustar Hostinger para Backend no Railway

## 📋 **SITUAÇÃO ATUAL:**

Você tem:
- ✅ **Backend** → Railway (funcionando)
- 📁 **Frontend** → Hostinger (precisa ajustar)

**Problema:** O `.htaccess` está apontando para `localhost:4000`, mas o backend está no Railway!

---

## 🎯 **O QUE PRECISA MUDAR:**

### 1️⃣ **Remover pasta `cassino-backend/`**

Já que o backend está no Railway, você **não precisa** dessa pasta no Hostinger.

**Ação:**
- Delete a pasta `cassino-backend/` no servidor Hostinger

---

### 2️⃣ **Atualizar `.htaccess`**

O `.htaccess` atual aponta para `localhost:4000`, mas precisa apontar para a **URL do Railway**.

**Ação:**
- Substitua `http://localhost:4000` pela URL do seu backend no Railway

---

### 3️⃣ **Fazer build e upload do frontend**

Se você ainda não fez o build ou atualizou o código, precisa:

**Ação:**
- Fazer build do frontend
- Fazer upload dos arquivos atualizados

---

## 📝 **PASSO A PASSO COMPLETO:**

### **PASSO 1: Obter URL do Railway**

1. Acesse o [Railway](https://railway.app)
2. Clique no serviço do **backend**
3. Vá na aba **"Settings"**
4. Procure por **"Domains"** ou **"Public URL"**
5. **Copie a URL** (exemplo: `https://backendchinesa-production.up.railway.app`)

**⚠️ IMPORTANTE:** Se você tiver um domínio customizado no Railway, use ele. Se não, use a URL `*.up.railway.app`.

---

### **PASSO 2: Atualizar `.htaccess`**

Crie/atualize o arquivo `.htaccess` na raiz do `public_html/`:

```apache
# Proxy para API backend Node.js (Railway)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forçar HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Proxy para API Railway
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ https://SUA_URL_RAILWAY_AQUI/api/$1 [P,L]
  
  # Proxy para uploads (também no Railway)
  RewriteCond %{REQUEST_URI} ^/uploads
  RewriteRule ^uploads/(.*)$ https://SUA_URL_RAILWAY_AQUI/uploads/$1 [P,L]

  # Frontend - React Router (SPA)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Configurações de segurança
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compressão Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache para assets estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

**⚠️ SUBSTITUA:** `https://SUA_URL_RAILWAY_AQUI` pela URL real do Railway!

**Exemplo:**
```apache
RewriteRule ^api/(.*)$ https://backendchinesa-production.up.railway.app/api/$1 [P,L]
```

---

### **PASSO 3: Remover pasta backend**

No gerenciador de arquivos da Hostinger:

1. Navegue até a raiz (acima de `public_html/`)
2. **Delete a pasta `cassino-backend/`** (se existir)
3. Você não precisa mais dela!

---

### **PASSO 4: Fazer build do frontend**

No seu computador:

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
npm run build:client
```

Isso criará/atualizará a pasta `dist-client/` com os arquivos prontos.

---

### **PASSO 5: Upload do frontend**

No gerenciador de arquivos da Hostinger:

1. Entre na pasta `public_html/`
2. **Delete tudo** (ou faça backup primeiro)
3. **Upload do conteúdo de `dist-client/`:**
   - Selecione **TODOS** os arquivos dentro de `dist-client/`
   - Arraste para `public_html/`
   - Aguarde o upload completar

**Estrutura final:**
```
public_html/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── .htaccess
```

---

### **PASSO 6: Upload do `.htaccess`**

1. No gerenciador de arquivos, vá para `public_html/`
2. **Delete** o `.htaccess` antigo (se existir)
3. **Crie/upload** o novo `.htaccess` (com a URL do Railway)
4. Certifique-se de que está na **raiz** de `public_html/`

---

## ✅ **ESTRUTURA FINAL NO HOSTINGER:**

```
/home/seu_usuario/
│
└── public_html/              # Apenas frontend
    ├── index.html
    ├── assets/
    │   ├── index-xxxxx.js
    │   └── index-xxxxx.css
    └── .htaccess             # ← Aponta para Railway
```

**Não precisa mais:**
- ❌ `cassino-backend/`
- ❌ Configuração Node.js no cPanel
- ❌ Variáveis de ambiente no Hostinger (estão no Railway)

---

## 🧪 **TESTAR:**

### 1. Testar Frontend:
```
https://seudominio.com
```
Deve mostrar a página do cassino.

### 2. Testar API (via proxy):
```
https://seudominio.com/api/providers
```
Deve retornar dados do Railway (ou array vazio se não houver dados).

### 3. Testar Admin:
```
https://seudominio.com/admin
```
Deve carregar o painel admin.

---

## 🔍 **TROUBLESHOOTING:**

### ❌ Erro 502 Bad Gateway ao acessar /api

**Solução:**
- Verifique se a URL do Railway no `.htaccess` está correta
- Verifique se o backend Railway está online
- Teste a URL do Railway diretamente: `https://sua-url.up.railway.app/api/providers`

---

### ❌ Erro de CORS

**Solução:**
- No Railway, verifique se o backend tem CORS configurado para aceitar requisições do seu domínio
- O código já deve ter CORS habilitado, mas verifique

---

### ❌ Frontend não carrega

**Solução:**
- Verifique se os arquivos de `dist-client/` estão na raiz de `public_html/`
- Verifique se `index.html` existe
- Verifique permissões dos arquivos (644 para arquivos, 755 para pastas)

---

### ❌ API retorna 404

**Solução:**
- Verifique o `.htaccess` (certifique-se que o módulo `mod_rewrite` está ativo)
- Verifique se a URL do Railway está correta
- Teste diretamente a URL do Railway no navegador

---

## 📊 **COMPARAÇÃO:**

### ❌ **ANTES (Backend no Hostinger):**
```
public_html/          → Frontend
cassino-backend/      → Backend Node.js (localhost:4000)
.htaccess             → Proxy para localhost:4000
```

### ✅ **AGORA (Backend no Railway):**
```
public_html/          → Frontend
.htaccess             → Proxy para Railway URL
(backend no Railway)  → Backend Node.js (Railway)
```

---

## 🎯 **CHECKLIST:**

- [ ] Obter URL do Railway
- [ ] Atualizar `.htaccess` com URL do Railway
- [ ] Remover pasta `cassino-backend/`
- [ ] Fazer build do frontend (`npm run build:client`)
- [ ] Upload de `dist-client/` para `public_html/`
- [ ] Upload do `.htaccess` atualizado
- [ ] Testar frontend (https://seudominio.com)
- [ ] Testar API (https://seudominio.com/api/providers)
- [ ] Testar admin (https://seudominio.com/admin)

---

## 💡 **VANTAGENS DESTA CONFIGURAÇÃO:**

✅ **Backend escalável** no Railway
✅ **MySQL gerenciado** no Railway
✅ **Frontend simples** no Hostinger (apenas arquivos estáticos)
✅ **Mais fácil de atualizar** (backend e frontend separados)
✅ **Menos custos** (não precisa Node.js no Hostinger)

---

## 🚀 **PRONTO!**

Após seguir esses passos, seu sistema estará configurado:
- Frontend no Hostinger
- Backend no Railway
- MySQL no Railway
- Tudo funcionando! 🎉

---

**Precisa da URL do Railway? Vá no Railway → Seu serviço → Settings → Domains! 🔗**

