# 🚀 Guia de Deploy na Hostinger - BigBet777

## 📋 Pré-requisitos

- ✅ Conta na Hostinger (Plano Business ou superior)
- ✅ Acesso ao cPanel da Hostinger
- ✅ Node.js habilitado no servidor (versão 18+)
- ✅ Banco de dados MySQL criado

---

## 🗄️ Passo 1: Configurar o MySQL na Hostinger

### 1.1. Criar o banco de dados

1. Acesse o **cPanel** da Hostinger
2. Vá em **"Bancos de dados MySQL"**
3. Crie um novo banco:
   - Nome: `u123456789_chinesa` (ajuste conforme seu usuário)
   - Clique em **"Criar Banco de Dados"**

### 1.2. Criar usuário do banco

1. Na mesma página, vá em **"Adicionar Novo Usuário"**
2. Crie um usuário:
   - Usuário: `u123456789_user`
   - Senha: **gere uma senha forte**
   - Clique em **"Criar Usuário"**

### 1.3. Vincular usuário ao banco

1. Em **"Adicionar Usuário ao Banco de Dados"**
2. Selecione o usuário criado
3. Selecione o banco criado
4. Clique em **"Adicionar"**
5. Marque **"TODOS OS PRIVILÉGIOS"**
6. Clique em **"Fazer Alterações"**

### 1.4. Anotar as credenciais

Anote:
- **Host:** `localhost` (ou o IP fornecido pela Hostinger)
- **Banco:** `u123456789_chinesa`
- **Usuário:** `u123456789_user`
- **Senha:** a senha que você criou

---

## 📁 Passo 2: Preparar o Projeto

### 2.1. Instalar mysql2 localmente

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
npm install mysql2
```

### 2.2. Criar arquivo .env

Crie o arquivo `.env` na raiz com as credenciais:

```env
# MySQL Hostinger
DB_HOST=localhost
DB_USER=u123456789_user
DB_PASSWORD=sua_senha_aqui
DB_NAME=u123456789_chinesa

# Porta
PORT=4000

# PlayFivers
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_API_KEY=sua_chave_aqui

# Ambiente
NODE_ENV=production
```

### 2.3. Testar localmente

```bash
npm run dev
```

Verifique se conecta ao banco sem erros.

---

## 🚀 Passo 3: Build do Projeto

### 3.1. Build do Frontend

```bash
npm run build:client
```

Isso criará a pasta `dist-client/` com os arquivos estáticos.

### 3.2. Compilar TypeScript do Backend

Adicione no `package.json`:

```json
"scripts": {
  "build:server": "tsc --project tsconfig.server.json",
  "start": "node dist-server/index.js"
}
```

Crie `tsconfig.server.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "dist-server",
    "rootDir": "server"
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules"]
}
```

Depois faça o build:

```bash
npm run build:server
```

---

## 📤 Passo 4: Upload para Hostinger

### 4.1. Usando File Manager (cPanel)

1. Acesse o **cPanel**
2. Vá em **"Gerenciador de Arquivos"**
3. Navegue até `public_html/` ou crie uma pasta como `public_html/cassino/`
4. Faça upload de:
   - `dist-client/` → conteúdo para `public_html/`
   - `dist-server/` → para uma pasta separada (ex: `/home/user/cassino-backend/`)
   - `node_modules/` → para a mesma pasta do backend
   - `package.json`
   - `.env`
   - `server/uploads/` → crie a pasta vazia

### 4.2. Usando FTP (FileZilla)

1. Conecte via FTP usando credenciais da Hostinger
2. Faça upload da mesma estrutura acima

---

## ⚙️ Passo 5: Configurar Node.js na Hostinger

### 5.1. Habilitar Node.js

1. No cPanel, procure por **"Setup Node.js App"**
2. Clique em **"Create Application"**
3. Configure:
   - **Node.js version:** 18.x ou superior
   - **Application mode:** Production
   - **Application root:** caminho onde está o backend (ex: `/home/user/cassino-backend`)
   - **Application URL:** seu domínio ou subdomínio
   - **Application startup file:** `dist-server/index.js`

4. Clique em **"Create"**

### 5.2. Configurar variáveis de ambiente

Na mesma tela:
1. Role até **"Environment Variables"**
2. Adicione cada variável:
   - `DB_HOST` = `localhost`
   - `DB_USER` = `u123456789_user`
   - `DB_PASSWORD` = `sua_senha`
   - `DB_NAME` = `u123456789_chinesa`
   - `PORT` = `4000`
   - `NODE_ENV` = `production`
   - `PLAYFIVERS_API_KEY` = `sua_chave`

3. Clique em **"Save"**

### 5.3. Instalar dependências

1. Na mesma tela, clique em **"Run NPM Install"**
2. Aguarde a instalação das dependências

### 5.4. Iniciar a aplicação

1. Clique em **"Start"**
2. Verifique se o status fica **"Running"**

---

## 🌐 Passo 6: Configurar Domínio e Proxy

### 6.1. Frontend (arquivos estáticos)

Se você fez upload para `public_html/`, o frontend já estará acessível em:
```
https://seudominio.com
```

### 6.2. Backend (API)

Você precisa configurar um proxy reverso para `/api`:

Crie um arquivo `.htaccess` na raiz do `public_html/`:

```apache
# Proxy para API backend
RewriteEngine On
RewriteBase /

# Redirecionar /api para Node.js (porta 4000)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]

# Frontend (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</apache>
```

**Nota:** Altere `localhost:4000` para o endereço correto se for diferente.

---

## 🔒 Passo 7: Configurar HTTPS

### 7.1. SSL Gratuito

1. No cPanel, vá em **"SSL/TLS Status"**
2. Selecione seu domínio
3. Clique em **"Run AutoSSL"**
4. Aguarde a instalação do certificado

### 7.2. Forçar HTTPS

Adicione no `.htaccess`:

```apache
# Forçar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## ✅ Passo 8: Verificar o Deploy

### 8.1. Testar o Frontend

Acesse:
```
https://seudominio.com
```

Você deve ver a página inicial do BigBet777.

### 8.2. Testar a API

Acesse:
```
https://seudominio.com/api/health
```

Deve retornar:
```json
{"ok": true}
```

### 8.3. Testar o Admin

Acesse:
```
https://seudominio.com/admin
```

Você deve ver o painel administrativo.

---

## 🔍 Solução de Problemas

### Erro de conexão com MySQL

✅ Verifique as credenciais no `.env`
✅ Confirme que o usuário tem privilégios no banco
✅ Teste a conexão via phpMyAdmin

### Node.js não inicia

✅ Verifique os logs no cPanel (Setup Node.js App > Logs)
✅ Confirme que todas as dependências foram instaladas
✅ Verifique se a porta não está em uso

### API não responde

✅ Verifique o `.htaccess`
✅ Confirme que o Node.js está rodando
✅ Teste diretamente: `http://ip-do-servidor:4000/api/health`

### Uploads não funcionam

✅ Crie a pasta `server/uploads/` manualmente
✅ Dê permissões 755: `chmod 755 server/uploads`
✅ Verifique o caminho no código

---

## 📊 Estrutura Final na Hostinger

```
/home/seu_usuario/
├── cassino-backend/          # Backend Node.js
│   ├── dist-server/
│   │   └── index.js
│   ├── node_modules/
│   ├── .env
│   ├── package.json
│   └── server/
│       └── uploads/
│
└── public_html/              # Frontend (arquivos estáticos)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── .htaccess
```

---

## 🔄 Atualizações Futuras

Para atualizar o projeto:

1. Faça as alterações localmente
2. Teste localmente
3. Faça build: `npm run build:client` e `npm run build:server`
4. Faça upload apenas dos arquivos alterados
5. Reinicie o Node.js no cPanel (Setup Node.js App > Restart)

---

## 📞 Suporte Hostinger

Se tiver problemas:
- Chat ao vivo 24/7 no site da Hostinger
- Base de conhecimento: https://support.hostinger.com
- Ticket de suporte no painel

---

## 🎉 Pronto!

Seu cassino online está no ar na Hostinger com MySQL! 🚀

**URLs importantes:**
- Frontend: https://seudominio.com
- Admin: https://seudominio.com/admin
- API: https://seudominio.com/api

**Próximos passos:**
1. Configure o branding no /admin/branding
2. Adicione suas credenciais PlayFivers
3. Cadastre provedores e jogos
4. Adicione banners promocionais
5. Teste todos os recursos

Boa sorte com seu cassino! 🎰

