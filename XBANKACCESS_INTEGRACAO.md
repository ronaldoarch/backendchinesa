# Integração XBankAccess - Gateway de Pagamento PIX

Este documento descreve como usar o gateway de pagamento XBankAccess integrado ao sistema.

## 📋 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# XBankAccess
XBANKACCESS_BASE_URL=https://app.xbankaccess.com/api
XBANKACCESS_TOKEN=seu_token_aqui
XBANKACCESS_SECRET=seu_secret_aqui
```

Ou configure via banco de dados na tabela `settings`:
- `xbankaccess.token` - Token da API
- `xbankaccess.secret` - Secret da API

## 🔄 Funcionalidades

### 1. PIX-IN (Receber Pagamento / Depósito)

Criar um pagamento PIX para receber dinheiro.

**Endpoint:** `POST /api/payments/pix`

**Body:**
```json
{
  "amount": 100.00,
  "client": {
    "name": "Fulano de Tal",
    "email": "fulano@gmail.com",
    "document": "12345678911",
    "phone": "11900000000"
  },
  "gateway": "xbankaccess"
}
```

**Campos obrigatórios para XBankAccess:**
- `client.email` - Email do pagador
- `client.document` - CPF/CNPJ do pagador (apenas números)
- `client.phone` - Telefone do pagador (apenas números)

**Resposta:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "requestNumber": "uuid-da-transacao",
    "transactionId": "ID_DA_TRANSACAO",
    "qrCode": "00020126...",
    "qrCodeBase64": "data:image/png;base64,...",
    "amount": 100.00,
    "status": "PENDING"
  }
}
```

### 2. PIX-OUT (Enviar Pagamento / Saque)

Criar um saque PIX para enviar dinheiro.

**Endpoint:** `POST /api/payments/pix/out`

**Body:**
```json
{
  "amount": 50.00,
  "pixKey": "12345678911",
  "pixKeyType": "cpf"
}
```

**Tipos de chave PIX aceitos:**
- `cpf` - CPF (apenas números)
- `email` - Email
- `telefone` - Telefone (apenas números)
- `aleatoria` - Chave aleatória

**Resposta:**
```json
{
  "success": true,
  "transaction": {
    "id": 2,
    "requestNumber": "uuid-da-transacao",
    "transactionId": "ID_DA_TRANSACAO",
    "amount": 50.00,
    "pixKey": "12345678911",
    "pixKeyType": "cpf",
    "status": "PendingProcessing",
    "createdAt": "2025-12-13T21:53:51-03:00",
    "updatedAt": "2025-12-13T21:53:51-03:00"
  }
}
```

## 🔔 Webhooks

### Webhook XBankAccess

**Endpoint:** `POST /api/payments/webhook/xbankaccess`

O XBankAccess enviará notificações para este endpoint quando houver mudanças no status das transações.

**Payload PIX-IN (Depósito):**
```json
{
  "status": "paid",
  "idTransaction": "ID_DA_TRANSACAO",
  "typeTransaction": "PIX"
}
```

**Payload PIX-OUT (Saque):**
```json
{
  "status": "paid",
  "idTransaction": "ID_DA_TRANSACAO",
  "typeTransaction": "PAYMENT"
}
```

**Status possíveis:**
- `paid` - Pagamento confirmado
- `pending` - Aguardando pagamento
- `failed` - Falhou

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Webhook processado"
}
```

O sistema automaticamente:
- Atualiza o status da transação
- Credita o saldo do usuário quando depósito é confirmado
- Confirma o saque quando é processado

## 🧪 Testar Conexão

**Endpoint:** `POST /api/payments/test-connection/xbankaccess`

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Credenciais configuradas corretamente"
}
```

## 📊 Comparação com SuitPay

| Recurso | SuitPay | XBankAccess |
|---------|---------|-------------|
| PIX-IN | ✅ | ✅ |
| PIX-OUT | ❌ | ✅ |
| Cartão | ✅ | ❌ |
| Boleto | ✅ | ❌ |
| Webhook | ✅ | ✅ |

## 🔧 Uso no Frontend

### Criar Depósito PIX com XBankAccess

```typescript
const response = await api.post("/payments/pix", {
  amount: 100.00,
  client: {
    name: user.username,
    email: user.email,
    document: user.document,
    phone: user.phone
  },
  gateway: "xbankaccess" // Especificar gateway
});
```

### Criar Saque PIX

```typescript
const response = await api.post("/payments/pix/out", {
  amount: 50.00,
  pixKey: "12345678911",
  pixKeyType: "cpf"
});
```

## ⚠️ Observações Importantes

1. **Campos obrigatórios:** XBankAccess requer `email`, `document` e `phone` para depósitos PIX
2. **Formato de dados:** 
   - CPF/CNPJ: apenas números (sem pontos/traços)
   - Telefone: apenas números (sem parênteses/traços)
3. **Webhook:** Configure a URL do webhook no painel do XBankAccess:
   - PIX-IN: `https://seudominio.com/api/payments/webhook/xbankaccess`
   - PIX-OUT: `https://seudominio.com/api/payments/webhook/xbankaccess`
4. **Status:** O sistema mapeia automaticamente os status do XBankAccess para o formato interno

## 📚 Documentação Oficial

Consulte a documentação oficial do XBankAccess para mais detalhes sobre a API.

