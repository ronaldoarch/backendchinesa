# 🔧 Corrigir Proxy 503 no Hostinger

## ❌ **PROBLEMA:**
Frontend recebendo erro 503 ao acessar `/api/*` - o proxy não está funcionando.

---

## ✅ **SOLUÇÕES:**

### **SOLUÇÃO 1: Verificar se `.htaccess` está no lugar certo**

1. Acesse o **File Manager** no cPanel da Hostinger
2. Entre em `public_html/`
3. Verifique se existe o arquivo `.htaccess`
4. Se não existir, crie/faça upload do arquivo `.htaccess.hostinger` renomeado para `.htaccess`

---

### **SOLUÇÃO 2: Verificar se `mod_proxy` está habilitado**

O Hostinger pode não ter `mod_proxy` habilitado. Nesse caso, use uma alternativa:

**Opção A: Usar URL direta no frontend (mais simples)**

1. No arquivo `src/services/api.ts`, altere para usar a URL completa:

```typescript
const baseURL = 
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";
```

2. Faça rebuild do frontend:
```bash
npm run build:client
```

3. Faça upload do novo build para `public_html/`

**Opção B: Habilitar mod_proxy (se disponível)**

1. Entre em contato com o suporte da Hostinger
2. Peça para habilitar `mod_proxy` e `mod_proxy_http`
3. Após habilitar, o `.htaccess` atual deve funcionar

---

### **SOLUÇÃO 3: Verificar URL do backend**

1. Teste diretamente no navegador:
   ```
   https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/health
   ```
   Deve retornar: `{"ok":true}`

2. Se não funcionar, verifique:
   - Backend está rodando no Coolify?
   - URL está correta?
   - Porta está exposta?

---

### **SOLUÇÃO 4: `.htaccess` alternativo (sem mod_proxy)**

Se `mod_proxy` não estiver disponível, use este `.htaccess` que redireciona (não faz proxy):

```apache
# Forçar HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Frontend - React Router (SPA)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

E use a **SOLUÇÃO 2 - Opção A** (URL direta no frontend).

---

## 🎯 **RECOMENDAÇÃO:**

**Use a SOLUÇÃO 2 - Opção A** (URL direta):
- ✅ Mais simples
- ✅ Não depende de configuração do servidor
- ✅ Funciona em qualquer hosting
- ✅ Mais rápido (sem proxy intermediário)

---

## 📝 **PASSO A PASSO RÁPIDO (SOLUÇÃO RECOMENDADA):**

1. **Editar `src/services/api.ts`:**
   ```typescript
   const baseURL = "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";
   ```

2. **Rebuild:**
   ```bash
   npm run build:client
   ```

3. **Upload para Hostinger:**
   - Upload de `dist-client/*` para `public_html/`

4. **Testar:**
   - Acesse o admin e veja se as chamadas funcionam

---

## ✅ **PRONTO!**

Após aplicar a solução, o frontend deve conseguir acessar o backend corretamente! 🚀




