# ⚙️ Configuração Final - Deploy Completo

## 📋 RESUMO DO QUE FOI CRIADO

### ✅ Arquivos Novos:

1. **database.sql** (3.9 KB)
   - 4 tabelas (providers, games, banners, settings)
   - Dados de exemplo incluídos
   - Pronto para importar no phpMyAdmin

2. **deploy.sh** (4.8 KB)
   - Script automatizado de deploy via SCP
   - Upload de tudo com um comando
   - Instala dependências automaticamente

3. **playfivers-v2.ts**
   - Serviço PlayFivers melhorado
   - Suporta múltiplos métodos de autenticação
   - Tenta múltiplos endpoints automaticamente
   - Melhor tratamento de erros

4. **.env.production**
   - Template com suas credenciais
   - Pronto para usar na Hostinger

5. **UPLOAD_SCP.md**
   - Guia completo de upload via SCP
   - Comandos prontos para usar

---

## 🔍 PROBLEMA PLAYFIVERS IDENTIFICADO

Baseado na documentação ([https://api.playfivers.com/docs/api](https://api.playfivers.com/docs/api)) e nas suas credenciais:

### ✅ Suas Credenciais:
- **Agent ID:** `agente03`
- **Agent Secret:** `fabebd5a-8f8e-414c-82a6-7...`
- **Agent Token:** `977bbb3e-98fb-4718-aad6-...`

### ⚠️ Possíveis Problemas:

1. **Método de Autenticação Incorreto**
   - Tentamos Bearer Token, mas pode precisar de outro método
   - O novo serviço tenta múltiplos métodos

2. **Endpoint Incorreto**
   - Endpoint pode ser `/v1/games`, `/games`, ou `/casino/games`
   - O novo serviço tenta todos automaticamente

3. **Estrutura do Payload**
   - Formato dos dados pode estar diferente
   - Novo serviço adapta conforme o método

---

## 🚀 DEPLOY COMPLETO EM 3 PASSOS

### Passo 1: Configurar Credenciais SSH

Edite o arquivo **`deploy.sh`** (linhas 13-15):

```bash
SSH_USER="seu_usuario_hostinger"
SSH_HOST="seu_servidor.hostinger.com"
SSH_PORT="22"
```

### Passo 2: Executar Deploy

```bash
cd /Users/ronaldodiasdesousa/Desktop/chinesa
./deploy.sh
```

O script vai:
- ✅ Testar conexão SSH
- ✅ Criar diretórios no servidor
- ✅ Upload do frontend
- ✅ Upload do backend
- ✅ Upload do .htaccess
- ✅ Upload do database.sql
- ✅ Instalar dependências
- ✅ Instalar ts-node e mysql2

### Passo 3: Configurar no Servidor

Via SSH no servidor:

```bash
# Conectar
ssh seu_usuario@servidor.hostinger.com

# Copiar .env.production
cd ~/cassino-backend
nano .env

# Cole o conteúdo de .env.production
# Substitua as credenciais reais
# Salve: Ctrl+X, Y, Enter
```

---

## 📊 IMPORTAR BANCO DE DADOS

### Via phpMyAdmin (Recomendado):

1. Acesse phpMyAdmin
2. Selecione o banco `u127271520_chinesa`
3. Aba "Importar"
4. Escolha o arquivo `database.sql`
5. Clique em "Executar"

### Via SSH:

```bash
ssh usuario@servidor
mysql -u u127271520_chinesa -p u127271520_chinesa < ~/database.sql
```

---

## ⚙️ CONFIGURAR NODE.JS APP

No cPanel → Setup Node.js App:

1. **Create Application**
2. Configurar:
   - Node.js: 18.x
   - Root: `/home/usuario/cassino-backend`
   - Startup: `server/index.ts`
   - Mode: Production

3. **Variáveis de Ambiente:**
   ```
   DB_HOST=localhost
   DB_USER=u127271520_chinesa
   DB_PASSWORD=sua_senha
   DB_NAME=u127271520_chinesa
   PORT=4000
   NODE_ENV=production
   PLAYFIVERS_AGENT_ID=agente03
   PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7
   PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-
   PLAYFIVERS_AUTH_METHOD=bearer
   ```

4. **Run NPM Install** → **Start**

---

## 🧪 TESTAR

### 1. Frontend:
```
https://seudominio.com
```

### 2. API:
```
https://seudominio.com/api/health
```

### 3. Admin:
```
https://seudominio.com/admin
```

### 4. PlayFivers (no admin):
1. Vá em `/admin/playfivers`
2. As credenciais já devem estar preenchidas
3. Adicione um provedor
4. Adicione um jogo
5. Clique em "Enviar para PlayFivers"
6. Veja se conecta ou dá erro específico

---

## 🐛 DEBUG PLAYFIVERS

Se ainda não conectar:

### 1. Ver Logs no Servidor:

```bash
ssh usuario@servidor
cd ~/cassino-backend
tail -f logs/error.log
# ou
pm2 logs
```

### 2. Testar Manualmente:

```bash
curl -X POST https://api.playfivers.com/api/v1/games \
  -H "Authorization: Bearer 977bbb3e-98fb-4718-aad6-..." \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "pg_soft",
    "game_id": "fortune_tiger",
    "name": "Fortune Tiger",
    "agent_id": "agente03"
  }'
```

### 3. Verificar Resposta:

- **401 Unauthorized:** Token inválido ou expirado
- **404 Not Found:** Endpoint incorreto
- **400 Bad Request:** Payload inválido
- **200 OK:** Funcionou! 🎉

---

## 📞 SUPORTE PLAYFIVERS

Se precisar de ajuda específica da PlayFivers:

1. **Documentação:** https://api.playfivers.com/docs/api
2. **Suporte:** Veja se tem email/chat de suporte
3. **Verificar:**
   - Credenciais corretas?
   - Conta ativa?
   - Permissões configuradas?

---

## ✅ CHECKLIST FINAL

- [ ] Editar `deploy.sh` com credenciais SSH
- [ ] Executar `./deploy.sh`
- [ ] Importar `database.sql` no phpMyAdmin
- [ ] Configurar variáveis de ambiente no Node.js App
- [ ] Iniciar Node.js App
- [ ] Testar frontend
- [ ] Testar API
- [ ] Testar admin
- [ ] Testar PlayFivers
- [ ] Ver logs se houver erro
- [ ] Ajustar conforme documentação PlayFivers

---

## 🎉 ESTÁ PRONTO!

Todos os arquivos estão prontos para deploy:

- ✅ Frontend compilado (dist-client/)
- ✅ Backend TypeScript (server/)
- ✅ Banco de dados (database.sql)
- ✅ Script de deploy (deploy.sh)
- ✅ Serviço PlayFivers melhorado
- ✅ Documentação completa

**Execute o `deploy.sh` e siga o checklist!** 🚀


