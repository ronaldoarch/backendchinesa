# 📚 Implementação PlayFivers - Baseada na Documentação Oficial

## ✅ Análise da Documentação Completa

Analisei a documentação oficial em: https://api.playfivers.com/docs/api

## 🔑 Autenticação

**IMPORTANTE:** A autenticação da PlayFivers é feita via **body**, não via headers!

### Campos de Autenticação:
- `agentToken` (ou `agent_token`) - Token do agente
- `secretKey` (ou `secret_key`) - Chave secreta

**Todos os endpoints requerem esses campos no body da requisição**, mesmo para GET requests.

## 📡 Endpoints Implementados

### 1. **GET /api/v2/providers** - Listar Provedores
- **Método:** POST ou GET (com body)
- **Body:** `{ agentToken, secretKey }`
- **Resposta:** `{ status: 1, data: [{ id, name, image_url, wallet, status }], msg: "" }`

### 2. **GET /api/v2/games** - Listar Jogos
- **Método:** POST ou GET (com body)
- **Query Params:** `provider_code` (opcional)
- **Body:** `{ agentToken, secretKey }`
- **Resposta:** `{ status: 1, data: [{ name, image_url, round_free, status, original, game_code, ... }], msg: "" }`

### 3. **POST /api/v2/game_launch** - Iniciar Jogo
- **Método:** POST
- **Body:**
  ```json
  {
    "agentToken": "SEU_TOKEN_DE_AGENTE",
    "secretKey": "SUA_CHAVE_SECRETA",
    "user_code": "teste0209@email.com",
    "game_code": "126",
    "game_original": true,
    "user_balance": 100.5,
    "user_rtp": 70,
    "lang": "pt"
  }
  ```
- **Resposta:** `{ status: true, msg: "SUCCESS", launch_url: "http://game.playfiver.com/launch?token=...", user_code, user_balance, user_created, name }`

### 4. **GET /api/v2/agent** - Informações do Agente
- **Método:** POST ou GET (com body)
- **Body:** `{ agentToken, secretKey }`
- **Resposta:** `{ status: true, data: { rtp, limit_enable, limit_amount, limit_hour, bonus_enable } }`

### 5. **PUT /api/v2/agent** - Atualizar Informações do Agente
- **Método:** PUT
- **Body:** `{ agentToken, secretKey, rtp?, limit_enable?, limit_amount?, limit_hour?, bonus_enable?, callback_url? }`
- **Resposta:** `{ status: true, msg: "Agente atualizado com sucesso" }`

### 6. **POST /api/v2/free_bonus** - Rodadas Grátis
- **Método:** POST
- **Body:** `{ agentToken, secretKey, user_code, game_code, round }`

### 7. **GET /api/v2/balances** - Saldo das Carteiras
- **Método:** POST ou GET (com body)
- **Body:** `{ agentToken, secretKey }`

## 🔔 Webhooks

### POST /webhook - Webhook de Saldo
- **Body:**
  ```json
  {
    "type": "BALANCE",
    "user_code": "teste0209@email.com"
  }
  ```
- **Resposta esperada:** `{ msg: "", balance: 150.75 }`

### POST /api/webhook - Webhook de Transação
- **Body:**
  ```json
  {
    "type": "WinBet",
    "agent_code": "AGENTE123",
    "agent_secret": "SEGREDO123",
    "user_code": "teste0209@email.com",
    "user_balance": 150.75,
    "game_original": true,
    "game_type": "slot",
    "slot": {
      "provider_code": "PGSOFT",
      "game_code": "126",
      "type": "BASE",
      "round_id": "ROUND12345",
      "bet": 50,
      "win": 100,
      "txn_id": "TXN123456",
      "txn_type": "debit_credit",
      "user_before_balance": 200,
      "user_after_balance": 250,
      "created_at": "2023-10-01T12:34:56Z"
    }
  }
  ```
- **Resposta esperada:** `{ msg: "", balance: 150.75 }`

## 🔧 Mudanças Implementadas

### 1. **URL Base Corrigida**
- Antes: `https://api.playfivers.com/api`
- Agora: `https://api.playfivers.com` (sem `/api` no final)
- Endpoints: `/api/v2/*`

### 2. **Autenticação Corrigida**
- Antes: Tentava Bearer Token no header
- Agora: `agentToken` e `secretKey` no body (padrão)
- Função `addAuthToBody()` adiciona automaticamente

### 3. **Endpoints Corrigidos**
- ✅ `GET /api/v2/providers` (tenta POST primeiro, depois GET)
- ✅ `GET /api/v2/games?provider_code=XXX` (tenta POST primeiro, depois GET)
- ✅ `POST /api/v2/game_launch` (para iniciar jogos)
- ✅ `GET /api/v2/agent` (para testar conexão)
- ✅ `PUT /api/v2/agent` (para configurar callback_url)

### 4. **Webhooks Implementados**
- ✅ `/webhook` - Webhook de saldo (type: "BALANCE")
- ✅ `/api/webhook` - Webhook de transação (type: "WinBet", "LoseBet", etc.)
- ✅ Processamento de diferentes tipos de eventos
- ✅ Retorno correto de saldo atualizado

### 5. **Interface Admin Atualizada**
- ✅ Método de autenticação padrão: "agent" (body)
- ✅ Campo para selecionar método de auth
- ✅ Labels atualizados

## 📝 Como Usar

### 1. Configurar Credenciais

No painel admin, configure:
- **ID do agente**: Seu `agentId` (opcional, se não usar agentToken)
- **Secret do agente**: Seu `secretKey` ou `agentSecret`
- **Token (API key)**: Seu `agentToken`
- **Método de Autenticação**: "Agent" (padrão - usa body)

### 2. Testar Conexão

Clique em "Testar Conexão" - usa `GET /api/v2/agent` para verificar credenciais.

### 3. Buscar Provedores

Clique em "Buscar Provedores" - usa `GET /api/v2/providers`.

### 4. Buscar Jogos

Selecione um provedor (opcional) e clique em "Buscar Jogos" - usa `GET /api/v2/games?provider_code=XXX`.

### 5. Configurar Callback URL

Clique em "Configurar na PlayFivers" - usa `PUT /api/v2/agent` com `callback_url` no body.

## ⚠️ Notas Importantes

1. **Autenticação sempre no body**: Mesmo para GET requests, a PlayFivers pode requerer `agentToken` e `secretKey` no body.

2. **Formato de resposta**: A API retorna `{ status: 1, data: [...], msg: "" }` ou `{ status: true, data: {...}, msg: "..." }`.

3. **Webhooks**: Devem retornar `{ msg: "", balance: <saldo_atualizado> }` para webhooks de saldo/transação.

4. **Callback URL**: Configure via `PUT /api/v2/agent` com `callback_url` no body, ou configure manualmente no painel da PlayFivers.

## 🚀 Próximos Passos

1. Aguardar deploy no Coolify
2. Testar conexão com as credenciais corretas
3. Verificar logs para confirmar que está funcionando
4. Configurar callback URL
5. Testar webhooks quando houver transações




