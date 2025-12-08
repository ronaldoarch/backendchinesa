# 🚀 Deploy Agora - Passo a Passo Rápido

## ✅ **BUILD FEITO!**

Arquivos prontos em: `dist-client/`

---

## 📤 **UPLOAD NO HOSTINGER:**

### **PASSO 1: Acessar Gerenciador de Arquivos**

1. Acesse o **cPanel da Hostinger**
2. Vá em **"Gerenciador de Arquivos"**
3. Navegue até `public_html/`

---

### **PASSO 2: Limpar Arquivos Antigos**

1. **Delete tudo dentro de `public_html/`** (exceto `.htaccess` se existir)
   - Ou faça backup primeiro se quiser

---

### **PASSO 3: Upload dos Arquivos Novos**

1. **Selecione TODOS os arquivos de `dist-client/`:**
   - `index.html`
   - Pasta `assets/` (com os arquivos dentro)

2. **Faça upload para `public_html/`**

3. **Estrutura final deve ser:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-aZO18wpt.js
   │   └── index-BDxwT-Q_.css
   └── .htaccess (próximo passo)
   ```

---

### **PASSO 4: Atualizar `.htaccess`**

1. **No `public_html/`, crie/edite o arquivo `.htaccess`**

2. **Cole este conteúdo:**

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
  RewriteRule ^api/(.*)$ https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/$1 [P,L]
  
  # Proxy para uploads (também no Railway)
  RewriteCond %{REQUEST_URI} ^/uploads
  RewriteRule ^uploads/(.*)$ https://g40okoockcoskwwwgc4sowso.agenciamidas.com/uploads/$1 [P,L]

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

3. **Salve o arquivo**

---

### **PASSO 5: Remover Pasta Backend (se existir)**

1. **Volte para a raiz** (acima de `public_html/`)
2. **Delete a pasta `cassino-backend/`** (se existir)
   - Não precisa mais, backend está no Railway!

---

## ✅ **CHECKLIST:**

- [ ] Deletei arquivos antigos de `public_html/`
- [ ] Fiz upload de `index.html` e `assets/` para `public_html/`
- [ ] Criei/atualizei o `.htaccess` com a URL do Railway
- [ ] Deletei a pasta `cassino-backend/` (se existia)

---

## 🧪 **TESTAR:**

### **1. Frontend:**
```
https://seudominio.com
```
Deve carregar a página do cassino.

### **2. Admin:**
```
https://seudominio.com/admin/playfivers
```
Deve carregar o painel admin com as novas funcionalidades!

### **3. API:**
```
https://seudominio.com/api/providers
```
Deve retornar dados (ou array vazio).

---

## 🎯 **FUNCIONALIDADES NOVAS NO ADMIN:**

Agora você pode:

1. ✅ **Testar Conexão** - Botão para testar credenciais PlayFivers
2. ✅ **Buscar Provedores** - Buscar todos os provedores da PlayFivers
3. ✅ **Importar Provedores** - Importar provedores da PlayFivers
4. ✅ **Buscar Jogos** - Buscar todos os jogos da PlayFivers
5. ✅ **Importar Jogos** - Importar jogos individual ou em massa
6. ✅ **Feedback Visual** - Mensagens de sucesso/erro

---

## 🎉 **PRONTO!**

Após fazer o upload, seu sistema estará **100% funcional** com todas as melhorias!

---

## 💡 **DICA:**

Se algo não funcionar:
1. Limpe o cache do navegador (Ctrl + F5)
2. Verifique se o `.htaccess` está correto
3. Verifique se os arquivos estão na raiz de `public_html/`
4. Veja os logs do Railway para erros do backend

---

**Boa sorte! 🚀**

