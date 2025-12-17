# 🚀 Build e Deploy do Frontend na Hostinger

## 📋 Situação Atual

- **Frontend:** Hostinger (arquivos estáticos)
- **Backend:** Coolify (`https://g40okoockcoskwwwgc4sowso.agenciamidas.com`)
- **Banco:** Railway (MySQL)

## ✅ Passo 1: Fazer Build do Frontend

### 1.1. Instalar dependências (se necessário)
```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
npm install
```

### 1.2. Fazer build do frontend
```bash
npm run build:client
```

Isso criará a pasta `dist-client/` com todos os arquivos estáticos prontos para upload.

## 📤 Passo 2: Upload para Hostinger

### 2.1. Via File Manager (cPanel)

1. Acesse o **cPanel** da Hostinger
2. Vá em **"Gerenciador de Arquivos"**
3. Navegue até `public_html/`
4. **DELETE todos os arquivos antigos** (exceto `.htaccess` se já existir)
5. Faça upload de **TODOS os arquivos** da pasta `dist-client/` para `public_html/`
   - `index.html`
   - Pasta `assets/` (com todos os JS e CSS)
   - Qualquer outro arquivo que estiver em `dist-client/`

### 2.2. Configurar .htaccess

1. No `public_html/`, verifique se existe o arquivo `.htaccess`
2. Se não existir ou estiver incorreto, faça upload do arquivo `.htaccess.hostinger` e renomeie para `.htaccess`
3. O conteúdo deve ser:

```apache
# Proxy para API backend Node.js (Coolify)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forçar HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Proxy para API Coolify
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/$1 [P,L]
  
  # Proxy para uploads (também no Coolify)
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

### 2.3. Verificar permissões

Certifique-se de que:
- `index.html` tem permissão 644
- Pasta `assets/` tem permissão 755
- `.htaccess` tem permissão 644

## 🔍 Passo 3: Verificar o Deploy

### 3.1. Testar o Frontend
Acesse: `https://darksalmon-jay-364290.hostingersite.com`

Você deve ver a página inicial do BigBet777.

### 3.2. Testar a API (via proxy)
Acesse: `https://darksalmon-jay-364290.hostingersite.com/api/health`

Deve retornar: `{"ok": true}`

### 3.3. Testar Login/Registro
1. Clique em "Registro" ou "Login"
2. Tente criar uma conta ou fazer login
3. Verifique se as requisições estão indo para o backend no Coolify

## ⚠️ Solução de Problemas

### Erro ERR_HTTP2_PROTOCOL_ERROR

**Possíveis causas:**
1. Arquivos do build não foram enviados corretamente
2. `.htaccess` está incorreto ou ausente
3. Problema com SSL/HTTPS na Hostinger
4. Proxy não está funcionando

**Soluções:**
1. ✅ Verifique se todos os arquivos de `dist-client/` foram enviados
2. ✅ Confirme que o `.htaccess` está correto e ativo
3. ✅ No cPanel, vá em "SSL/TLS Status" e execute "Run AutoSSL"
4. ✅ Verifique se o módulo `mod_rewrite` está habilitado (geralmente está)
5. ✅ Teste o backend diretamente: `https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/health`

### Frontend carrega mas API não funciona

1. Verifique o `.htaccess` - o proxy deve apontar para o Coolify
2. Teste o backend diretamente no Coolify
3. Verifique os logs de erro no cPanel

### Página em branco

1. Abra o Console do navegador (F12)
2. Verifique erros de JavaScript
3. Confirme que os arquivos em `assets/` foram carregados
4. Verifique se o caminho dos assets está correto

## 🔄 Atualizações Futuras

Sempre que fizer alterações no frontend:

1. **Fazer build:**
   ```bash
   npm run build:client
   ```

2. **Fazer upload:**
   - Delete os arquivos antigos em `public_html/`
   - Faça upload dos novos arquivos de `dist-client/`
   - Mantenha o `.htaccess` intacto

3. **Limpar cache do navegador:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

## 📝 Checklist Final

- [ ] Build do frontend feito (`npm run build:client`)
- [ ] Arquivos de `dist-client/` enviados para `public_html/`
- [ ] `.htaccess` configurado corretamente
- [ ] SSL/HTTPS ativo na Hostinger
- [ ] Frontend carrega corretamente
- [ ] API responde via proxy (`/api/health`)
- [ ] Login/Registro funcionando
- [ ] Rotas protegidas funcionando

## 🎉 Pronto!

Seu frontend está no ar na Hostinger e se comunicando com o backend no Coolify!
