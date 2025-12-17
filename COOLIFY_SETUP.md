# 🚀 Coolify - Configuração do Backend

## 📋 Arquitetura

- **Backend Node.js** → Coolify
- **Banco MySQL** → Railway

---

## 🔑 PASSO 1: Obter Credenciais do Railway MySQL

1. Acesse o [Railway](https://railway.app)
2. Clique no serviço **"MySQL"**
3. Vá na aba **"Variables"** (onde você está agora)
4. **OU** vá na aba **"Connect"** para ver as credenciais completas

### Credenciais necessárias:

```
Host: hopper.proxy.rlwy.net
Port: 36793
User: root
Password: (sua senha - copie da variável MYSQL_ROOT_PASSWORD)
Database: railway (ou o nome que aparecer)
```

**⚠️ IMPORTANTE:** Copie o valor real da senha (não os `*******`). Use o ícone de "olho" 👁️ para revelar.

---

## ⚙️ PASSO 2: Configurar Variáveis no Coolify

### No Coolify:

1. Acesse seu projeto no **Coolify**
2. Clique no serviço do **backend** (sua aplicação Node.js)
3. Vá em **"Environment Variables"** ou **"Variables"**
4. Clique em **"+ Add Variable"** para cada variável abaixo:

---

## 📝 VARIÁVEIS DE AMBIENTE

### 🔵 Banco de Dados (Railway MySQL)

Adicione estas variáveis com os valores do Railway:

```env
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=36793
DB_USER=root
DB_PASSWORD=SUA_SENHA_DO_RAILWAY_AQUI
DB_NAME=railway
```

**⚠️ Substitua `SUA_SENHA_DO_RAILWAY_AQUI` pela senha real do Railway!**

---

### 🟢 Servidor Node.js

```env
PORT=4000
```

**Nota:** O Coolify geralmente define automaticamente uma porta. Você pode usar `$PORT` ou deixar como `4000`.

---

### 🟡 PlayFivers (API de Jogos)

**Opção 1 - Versão atual (usando API Key):**

```env
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_API_KEY=SUA_API_KEY_AQUI
```

**Opção 2 - Versão nova (usando Agent):**

```env
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD=bearer
PLAYFIVERS_AGENT_ID=agente03
PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-8d06d4b55f42
```

**💡 Use a Opção 2 se você tem essas credenciais. Caso contrário, use a Opção 1.**

---

## ✅ LISTA COMPLETA DE VARIÁVEIS

Copie e cole todas estas variáveis no Coolify (substitua os valores pelos seus):

```env
# Banco de Dados Railway
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=36793
DB_USER=root
DB_PASSWORD=COLE_A_SENHA_DO_RAILWAY_AQUI
DB_NAME=railway

# Servidor
PORT=4000

# PlayFivers (Agent)
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD=bearer
PLAYFIVERS_AGENT_ID=agente03
PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-8d06d4b55f42
```

---

## 🚫 NÃO ADICIONE ESTAS VARIÁVEIS

**❌ NODE_ENV** - Não precisa, o Coolify gerencia isso automaticamente.

---

## 📸 Como Adicionar no Coolify

1. **No Coolify, abra seu serviço backend**
2. **Vá em "Environment" ou "Variables"**
3. **Clique em "+ Add Variable"**
4. **Adicione cada variável:**

   - **Key:** `DB_HOST`
   - **Value:** `hopper.proxy.rlwy.net`
   - **Clique em "Save"**

5. **Repita para todas as variáveis acima**

---

## ✅ PASSO 3: Reiniciar o Serviço

Após adicionar todas as variáveis:

1. No Coolify, vá em **"General"** ou **"Overview"**
2. Clique em **"Redeploy"** ou **"Restart"**
3. Aguarde o deploy completar

---

## 🧪 PASSO 4: Verificar se Funcionou

### Ver logs no Coolify:

1. Vá em **"Logs"** do seu serviço
2. Procure por esta mensagem:

```
✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!
```

**Se aparecer isso, está funcionando! 🎉**

---

## 🔍 Troubleshooting

### ❌ Erro: "ECONNREFUSED" ou "Can't connect to MySQL"

**Solução:**
- Verifique se `DB_HOST` está correto: `hopper.proxy.rlwy.net`
- Verifique se `DB_PORT` está correto: `36793`
- Verifique se a senha do Railway está correta
- Certifique-se de que o MySQL do Railway está ativo (verifique no Railway)

---

### ❌ Erro: "Access denied for user"

**Solução:**
- Verifique se `DB_USER` está como `root`
- Verifique se `DB_PASSWORD` está correto (copie exatamente do Railway)
- No Railway, vá em "Variables" e copie o valor real de `MYSQL_ROOT_PASSWORD`

---

### ❌ Erro: "Unknown database"

**Solução:**
- Verifique se `DB_NAME` está correto (geralmente `railway`)
- No Railway, vá em "Variables" e verifique o valor de `MYSQL_DATABASE`

---

### ❌ Backend não inicia

**Solução:**
- Verifique se todas as variáveis foram adicionadas
- Veja os logs no Coolify para identificar o erro
- Certifique-se de que a porta `PORT=4000` está configurada
- Verifique se o build está funcionando (veja logs de build)

---

## 📋 Checklist Final

- [ ] Copiei a senha do Railway (MYSQL_ROOT_PASSWORD)
- [ ] Adicionei todas as variáveis no Coolify
- [ ] Reiniciei o serviço no Coolify
- [ ] Vejo a mensagem "✅ Banco de dados MySQL conectado" nos logs
- [ ] Backend está respondendo nas rotas da API

---

## 🎯 Próximos Passos

1. ✅ Variáveis configuradas no Coolify
2. ✅ Backend conectado ao MySQL do Railway
3. 🔄 Testar endpoints da API
4. 🔄 Configurar domínio (se necessário)

---

## 💡 Dica

**Para ver todas as variáveis do Railway de uma vez:**

1. No Railway, clique no serviço **MySQL**
2. Vá em **"Variables"**
3. Use o botão **"Raw Editor"** (ícone `{}`) para ver todas em formato JSON
4. Copie os valores que precisa

---

**Precisa de ajuda? Me mostre os logs do Coolify! 📸**

