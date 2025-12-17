# 🚀 MÉTODO SIMPLES - Upload Direto na Hostinger

## ✅ Solução Mais Fácil

Como o build do backend TypeScript apresentou problemas, vamos usar um método mais simples e direto!

---

## 📤 O QUE FAZER UPLOAD

### **1. Frontend (public_html/)**

✅ **Pasta `dist-client/`** já está pronta!

**Fazer upload de:**
- Todo o conteúdo da pasta `dist-client/`
- Arquivo `.htaccess` (raiz do projeto)

### **2. Backend (cassino-backend/)**

❌ **NÃO precisa de `dist-server/`**  
✅ **Suba os arquivos TypeScript originais!**

**Fazer upload de:**
- Pasta `server/` completa (com arquivos `.ts`)
- Pasta `node_modules/` completa
- Arquivo `package.json`
- Arquivo `tsconfig.json`
- Arquivo `.env` (com suas credenciais)

---

## ⚙️ CONFIGURAR NODE.JS NA HOSTINGER

### No cPanel → Setup Node.js App:

1. **Node.js version:** 18.x ou superior
2. **Application mode:** Production
3. **Application root:** `/home/usuario/cassino-backend`
4. **Application startup file:** `server/index.ts` ⬅️ **Arquivo TypeScript direto!**
5. **Application URL:** seu domínio

### Variáveis de Ambiente:

Adicione:
```
DB_HOST=localhost
DB_USER=u123456789_user
DB_PASSWORD=sua_senha
DB_NAME=u123456789_chinesa
PORT=4000
NODE_ENV=production
PLAYFIVERS_API_KEY=sua_chave
```

### Instalar Dependências:

1. **Clique em "Run NPM Install"**
2. **Aguarde a instalação**

### Adicionar ts-node:

No terminal SSH da Hostinger (ou via cPanel):

```bash
cd ~/cassino-backend
npm install ts-node typescript @types/node --save
```

### Iniciar:

**Clique em "Start"**

---

## 📁 ESTRUTURA NA HOSTINGER

```
/home/usuario/
├── public_html/              # Frontend
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.css
│   │   └── index-xxx.js
│   └── .htaccess
│
└── cassino-backend/          # Backend
    ├── server/               # Arquivos TypeScript originais
    │   ├── index.ts
    │   ├── db.ts
    │   └── routes/
    ├── node_modules/
    ├── package.json
    ├── tsconfig.json
    └── .env
```

---

## 🎯 ALTERNATIVA: USAR APENAS FRONTEND

Se tiver dificuldades com o backend, você pode:

1. **Subir apenas o frontend** (`dist-client/`)
2. **Usar um backend externo** (outro servidor, Vercel, Railway, etc)
3. **Ou configurar depois**

O frontend funciona independente do backend para visualização!

---

## ✅ RESUMO RÁPIDO

### Opção 1: TypeScript Direto (Recomendado)
```
1. Upload dist-client/ → public_html/
2. Upload server/ + node_modules/ → cassino-backend/
3. Configurar Node.js App com server/index.ts
4. npm install ts-node typescript
5. Start
```

### Opção 2: Apenas Frontend
```
1. Upload dist-client/ → public_html/
2. Pronto! Site estático funciona
3. Configurar backend depois
```

---

## 📞 PRECISA DE AJUDA?

A Hostinger tem suporte 24/7 via chat. Peça ajuda com:
- "Como configurar aplicação Node.js TypeScript"
- "Como usar ts-node no servidor"

---

## 🎉 PRÓXIMOS PASSOS

1. **Faça upload do `dist-client/` para `public_html/`**
2. **Teste o frontend:** `https://seudominio.com`
3. **Se funcionar, configure o backend depois**

**O importante é colocar o site no ar primeiro! 🚀**

---

*Dica: O frontend já funciona perfeitamente. O backend pode ser configurado gradualmente.*

