# 📋 Resumo - O Que Mudar no Hostinger

## 🎯 **SITUAÇÃO:**

Você está vendo no Hostinger:
- `assets/` (pasta)
- `cassino-backend/` (pasta) ← **REMOVER**
- `.htaccess` (arquivo) ← **ATUALIZAR**
- `index.html` (arquivo)

---

## ✅ **MUDANÇAS NECESSÁRIAS:**

### 1️⃣ **REMOVER:**
- ❌ Pasta `cassino-backend/` (não precisa mais, backend está no Railway)

### 2️⃣ **ATUALIZAR:**
- ✏️ Arquivo `.htaccess` (apontar para Railway ao invés de localhost)

### 3️⃣ **MANTER:**
- ✅ Pasta `assets/`
- ✅ Arquivo `index.html`

---

## 🔧 **PASSO A PASSO RÁPIDO:**

### **1. Obter URL do Railway**

No Railway:
- Serviço backend → Settings → Domains
- Copie a URL (ex: `https://backendchinesa-production.up.railway.app`)

---

### **2. Atualizar `.htaccess`**

Abra o `.htaccess` no Hostinger e encontre esta linha:

```apache
RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]
```

**Substitua por:**

```apache
RewriteRule ^api/(.*)$ https://SUA-URL-RAILWAY.up.railway.app/api/$1 [P,L]
```

E também esta linha:

```apache
RewriteRule ^uploads/(.*)$ http://localhost:4000/uploads/$1 [P,L]
```

**Substitua por:**

```apache
RewriteRule ^uploads/(.*)$ https://SUA-URL-RAILWAY.up.railway.app/uploads/$1 [P,L]
```

**⚠️ Use `https://` (não `http://`) e substitua `SUA-URL-RAILWAY` pela URL real!**

---

### **3. Deletar pasta backend**

No gerenciador de arquivos:
- Clique com botão direito na pasta `cassino-backend/`
- Selecione **Delete**
- Confirme

---

### **4. (Opcional) Atualizar frontend**

Se você mudou o código:
- Faça build: `npm run build:client`
- Upload dos arquivos de `dist-client/` para `public_html/`

---

## ✅ **ESTRUTURA FINAL:**

```
public_html/
├── assets/          ✅ Manter
├── index.html       ✅ Manter
└── .htaccess        ✏️ Atualizar (URL Railway)
```

**Sem mais:**
- ❌ `cassino-backend/`

---

## 🧪 **TESTAR:**

1. Acesse: `https://seudominio.com`
2. Deve carregar normalmente
3. Teste API: `https://seudominio.com/api/providers`

---

## 📖 **GUIA COMPLETO:**

Para mais detalhes, veja: **`AJUSTAR_HOSTINGER_RAILWAY.md`**

---

**É só isso! Simples e rápido! 🚀**

