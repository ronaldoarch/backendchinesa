# 🚀 Upload Simples na Hostinger - MySQL já configurado

## ✅ Passo a Passo Rápido

### 1️⃣ INSTALAR MYSQL2 (Localmente)

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
npm install mysql2
```

### 2️⃣ FAZER BUILD DO PROJETO

```bash
npm run build
```

Isso cria:
- ✅ `dist-client/` - Frontend pronto
- ✅ `dist-server/` - Backend pronto

---

## 📤 3️⃣ UPLOAD NA HOSTINGER

### Opção A: File Manager (cPanel)

1. **Acesse o cPanel da Hostinger**
2. **Vá em "Gerenciador de Arquivos"**

#### Upload do Frontend:
3. Entre em `public_html/`
4. **Delete tudo que estiver lá** (se for site novo)
5. **Upload do conteúdo de `dist-client/`:**
   - Selecione TUDO dentro da pasta `dist-client/`
   - Arraste para `public_html/`
   - Aguarde o upload

#### Upload do Backend:
6. Volte para `/home/seu_usuario/`
7. **Crie uma pasta:** `cassino-backend`
8. Entre na pasta `cassino-backend/`
9. **Upload dos arquivos:**
   - Toda pasta `dist-server/`
   - Toda pasta `node_modules/`
   - Arquivo `package.json`
10. **Crie uma pasta:** `server/uploads/` (vazia)

#### Upload do .htaccess:
11. Volte para `public_html/`
12. **Upload do arquivo `.htaccess`** (na raiz)

### Opção B: FTP (FileZilla)

Conecte via FTP e faça o mesmo upload acima.

---

## 🗄️ 4️⃣ CONFIGURAR BANCO MYSQL

### No cPanel:

1. **Vá em "Bancos de dados MySQL"**
2. **Crie o banco:**
   - Nome: `chinesa` (ou qualquer nome)
   - Clique em "Criar"

3. **Crie usuário:**
   - Usuário: `chinesa_user` (ou qualquer)
   - Senha: **gere uma forte**
   - Clique em "Criar"

4. **Vincule usuário ao banco:**
   - Selecione usuário e banco
   - Marque "Todos os privilégios"
   - Clique em "Adicionar"

5. **Anote as credenciais:**
   ```
   Host: localhost
   Banco: u123456789_chinesa (nome completo que aparece)
   Usuário: u123456789_user (nome completo que aparece)
   Senha: a senha que você criou
   ```

---

## ⚙️ 5️⃣ CONFIGURAR NODE.JS

### No cPanel:

1. **Procure "Setup Node.js App"** (ou "Aplicações Node.js")
2. **Clique em "Create Application"**

3. **Configure:**
   - **Node.js version:** 18.x (ou a mais recente)
   - **Application mode:** Production
   - **Application root:** `/home/seu_usuario/cassino-backend`
   - **Application URL:** seu domínio (ex: `cassino.seusite.com`)
   - **Application startup file:** `dist-server/index.js`
   - **Passenger log file:** deixe padrão

4. **Clique em "Create"**

---

## 🔐 6️⃣ ADICIONAR VARIÁVEIS DE AMBIENTE

Na mesma tela do Node.js, role até **"Environment variables"**:

Adicione cada uma:

| Nome | Valor |
|------|-------|
| DB_HOST | localhost |
| DB_USER | u123456789_user |
| DB_PASSWORD | sua_senha_aqui |
| DB_NAME | u123456789_chinesa |
| PORT | 4000 |
| NODE_ENV | production |
| PLAYFIVERS_API_KEY | sua_chave (se tiver) |

**Clique em "Save"** após adicionar cada uma.

---

## 🚀 7️⃣ INSTALAR DEPENDÊNCIAS E INICIAR

Na mesma tela:

1. **Clique em "Run NPM Install"**
   - Aguarde instalar (pode demorar 1-2 minutos)

2. **Clique em "Start"** ou "Restart"
   - Status deve ficar "Running" (verde)

---

## 🌐 8️⃣ EDITAR .htaccess (SE NECESSÁRIO)

Se o `.htaccess` não funcionar automaticamente:

1. Abra o arquivo `.htaccess` em `public_html/`
2. Encontre a linha:
   ```apache
   RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]
   ```

3. **Ajuste a porta se for diferente** (veja qual porta o Node.js está usando)

---

## ✅ 9️⃣ TESTAR

### Teste o frontend:
```
https://seudominio.com
```
Deve mostrar a página inicial do cassino.

### Teste a API:
```
https://seudominio.com/api/health
```
Deve retornar: `{"ok": true}`

### Teste o admin:
```
https://seudominio.com/admin
```
Deve mostrar o painel administrativo.

---

## 🔒 ATIVAR SSL (HTTPS)

1. No cPanel, vá em **"SSL/TLS Status"**
2. Selecione seu domínio
3. Clique em **"Run AutoSSL"**
4. Aguarde 1-2 minutos
5. SSL instalado! ✅

O `.htaccess` já força HTTPS automaticamente.

---

## 📁 ESTRUTURA FINAL NA HOSTINGER

```
/home/seu_usuario/
│
├── public_html/              # Frontend
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   └── index-xxx.css
│   └── .htaccess
│
└── cassino-backend/          # Backend
    ├── dist-server/
    │   └── index.js
    ├── node_modules/
    ├── package.json
    └── server/
        └── uploads/
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ Erro 500 - Internal Server Error
**Solução:**
- Veja os logs no cPanel (Setup Node.js App → Ver logs)
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o Node.js está "Running"

### ❌ API não responde (/api/health)
**Solução:**
- Verifique o `.htaccess`
- Confirme a porta no `.htaccess` (deve ser a mesma do Node.js)
- Teste diretamente: `http://ip-servidor:4000/api/health`

### ❌ Node.js não inicia
**Solução:**
- Veja os logs de erro
- Confirme que `dist-server/index.js` existe
- Verifique se o banco de dados está acessível
- Teste conexão MySQL via phpMyAdmin

### ❌ "Cannot find module 'mysql2'"
**Solução:**
- Certifique-se que `node_modules/` foi enviado
- Ou clique em "Run NPM Install" novamente no cPanel

### ❌ Página em branco
**Solução:**
- Verifique se os arquivos de `dist-client/` estão na raiz de `public_html/`
- Não devem estar em subpasta
- `index.html` deve estar direto em `public_html/index.html`

---

## 📝 CHECKLIST RÁPIDO

- [ ] `npm install mysql2` executado
- [ ] `npm run build` executado
- [ ] `dist-client/` → `public_html/` (upload)
- [ ] `dist-server/` + `node_modules/` → `cassino-backend/` (upload)
- [ ] `.htaccess` → `public_html/` (upload)
- [ ] Banco MySQL criado no cPanel
- [ ] Usuário MySQL criado e vinculado
- [ ] Node.js App criada no cPanel
- [ ] Variáveis de ambiente configuradas
- [ ] NPM Install executado
- [ ] Node.js iniciado (status: Running)
- [ ] SSL ativado
- [ ] Frontend testado (https://seudominio.com)
- [ ] API testada (https://seudominio.com/api/health)
- [ ] Admin testado (https://seudominio.com/admin)

---

## 🎉 PRONTO!

Seu cassino está no ar! 🚀

**Próximos passos:**
1. Acesse `/admin/branding` e configure logo
2. Acesse `/admin/playfivers` e configure credenciais
3. Adicione provedores de jogos
4. Adicione jogos
5. Adicione banners

**Boa sorte! 🎰💰**

---

## 💡 DICA IMPORTANTE

Se você atualizar o código no futuro:

1. Faça o build localmente: `npm run build`
2. Substitua apenas os arquivos alterados via FTP
3. Reinicie o Node.js no cPanel (botão "Restart")
4. Limpe o cache do navegador (Ctrl + F5)

Não precisa reinstalar tudo! 😉

