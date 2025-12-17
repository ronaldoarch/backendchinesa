# 🚀 Passo a Passo - Atualizar Hostinger

## ✅ **URL DO BACKEND RAILWAY:**

```
https://g40okoockcoskwwwgc4sowso.agenciamidas.com/
```

---

## 📋 **O QUE FAZER NO HOSTINGER:**

### **PASSO 1: Remover pasta backend**

1. Acesse o **Gerenciador de Arquivos** no cPanel da Hostinger
2. Navegue até a raiz (acima de `public_html/`)
3. **Delete a pasta `cassino-backend/`** (se existir)
   - Clique com botão direito → Delete
   - Confirme

---

### **PASSO 2: Atualizar `.htaccess`**

1. No gerenciador de arquivos, entre na pasta `public_html/`
2. **Edite o arquivo `.htaccess`**
3. **Substitua as linhas:**

   **Encontre:**
   ```apache
   RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]
   ```
   
   **Substitua por:**
   ```apache
   RewriteRule ^api/(.*)$ https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/$1 [P,L]
   ```

   **E também encontre:**
   ```apache
   RewriteRule ^uploads/(.*)$ http://localhost:4000/uploads/$1 [P,L]
   ```
   
   **Substitua por:**
   ```apache
   RewriteRule ^uploads/(.*)$ https://g40okoockcoskwwwgc4sowso.agenciamidas.com/uploads/$1 [P,L]
   ```

4. **Salve o arquivo**

---

### **PASSO 3: (Opcional) Atualizar frontend**

Se você fez mudanças no código do frontend:

1. **No seu computador:**
   ```bash
   cd /Users/ronaldodiasdesousa/Desktop/chinesa
   npm run build:client
   ```

2. **No Hostinger:**
   - Delete tudo dentro de `public_html/` (exceto `.htaccess`)
   - Faça upload do conteúdo de `dist-client/` para `public_html/`

---

## ✅ **CHECKLIST:**

- [ ] Deletei a pasta `cassino-backend/`
- [ ] Atualizei o `.htaccess` com a URL do Railway
- [ ] (Opcional) Atualizei o frontend

---

## 🧪 **TESTAR:**

### 1. Testar Frontend:
```
https://seudominio.com
```
Deve carregar a página do cassino.

### 2. Testar API:
```
https://seudominio.com/api/providers
```
Deve retornar dados (ou array vazio se não houver).

### 3. Testar Admin:
```
https://seudominio.com/admin
```
Deve carregar o painel admin.

---

## 📝 **`.htaccess` COMPLETO (PRONTO PARA USAR):**

Você pode copiar o conteúdo do arquivo **`.htaccess.hostinger`** que já está com a URL correta configurada!

**Ou copie e cole este conteúdo no `.htaccess`:**

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

---

## 🎉 **PRONTO!**

Após fazer essas mudanças, seu sistema estará configurado:
- ✅ Frontend no Hostinger
- ✅ Backend no Railway (`https://g40okoockcoskwwwgc4sowso.agenciamidas.com/`)
- ✅ MySQL no Railway
- ✅ Tudo conectado e funcionando!

---

**É só isso! Simples e direto! 🚀**

