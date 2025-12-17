# 📡 Documentação da API - BigBet777

## Base URL

```
http://localhost:4000/api
```

---

## 🏥 Health Check

### GET /api/health

Verifica se a API está funcionando.

**Resposta:**
```json
{
  "ok": true
}
```

---

## 🎮 Provedores

### GET /api/providers

Lista todos os provedores de jogos.

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "PG Soft",
    "externalId": "pg_soft",
    "active": true
  }
]
```

### POST /api/providers

Cria um novo provedor.

**Body:**
```json
{
  "name": "Pragmatic Play",
  "externalId": "pragmatic",
  "active": true
}
```

**Resposta:** 201 Created
```json
{
  "id": 2,
  "name": "Pragmatic Play",
  "externalId": "pragmatic",
  "active": true
}
```

### PUT /api/providers/:id

Atualiza um provedor existente.

**Parâmetros:** `id` (número)

**Body:**
```json
{
  "name": "Pragmatic Play Updated",
  "active": false
}
```

**Resposta:** 200 OK

### DELETE /api/providers/:id

Remove um provedor.

**Parâmetros:** `id` (número)

**Resposta:** 204 No Content

---

## 🎲 Jogos

### GET /api/games

Lista todos os jogos.

**Resposta:**
```json
[
  {
    "id": 1,
    "providerId": 1,
    "name": "Fortune Tiger",
    "externalId": "fortune_tiger",
    "active": true
  }
]
```

### POST /api/games

Cria um novo jogo.

**Body:**
```json
{
  "providerId": 1,
  "name": "Fortune Tiger",
  "externalId": "fortune_tiger",
  "active": true
}
```

**Resposta:** 201 Created

### POST /api/games/:id/sync-playfivers

Sincroniza o jogo com a API PlayFivers.

**Parâmetros:** `id` (número)

**Resposta:**
```json
{
  "ok": true,
  "apiResponse": { /* resposta da PlayFivers */ }
}
```

---

## 🎨 Banners

### GET /api/banners

Lista todos os banners.

**Resposta:**
```json
[
  {
    "id": 1,
    "title": "Bônus de boas-vindas",
    "imageUrl": "/uploads/banner1.jpg",
    "linkUrl": "https://example.com/promocao",
    "position": 0,
    "active": true
  }
]
```

### POST /api/banners

Cria um novo banner.

**Body:**
```json
{
  "title": "Promoção Especial",
  "imageUrl": "https://example.com/banner.jpg",
  "linkUrl": "https://example.com/promo",
  "position": 1,
  "active": true
}
```

**Resposta:** 201 Created

### DELETE /api/banners/:id

Remove um banner.

**Parâmetros:** `id` (número)

**Resposta:** 204 No Content

---

## ⚙️ Configurações

### GET /api/settings

Retorna todas as configurações.

**Resposta:**
```json
{
  "branding.logoUrl": "/uploads/logo.png",
  "branding.faviconUrl": "/uploads/favicon.ico",
  "branding.loadingBannerUrl": "/uploads/loading.jpg",
  "playfivers.agentId": "12345",
  "playfivers.secret": "secret_key",
  "playfivers.token": "api_token"
}
```

### PUT /api/settings

Atualiza configurações (parcial ou completa).

**Body:**
```json
{
  "branding.logoUrl": "/uploads/new-logo.png",
  "playfivers.agentId": "67890"
}
```

**Resposta:** 204 No Content

---

## 📤 Uploads

### POST /api/uploads

Faz upload de um arquivo.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: arquivo a ser enviado

**Resposta:** 201 Created
```json
{
  "url": "/uploads/1234567890-abc123.jpg"
}
```

**Nota:** O arquivo será salvo em `server/uploads/` e acessível via `/uploads/nome-arquivo`

---

## 🔔 Webhook PlayFivers

### POST /api/playfivers/callback

Recebe callbacks da API PlayFivers.

**Body:** (formato definido pela PlayFivers)

**Resposta:**
```json
{
  "ok": true
}
```

**Nota:** Os dados do callback são logados no console do servidor.

---

## 🔒 Códigos de Erro

- **400 Bad Request** - Dados inválidos
- **404 Not Found** - Recurso não encontrado
- **500 Internal Server Error** - Erro no servidor

---

## 📝 Exemplos de Uso

### Criar um provedor e jogo completo

```bash
# 1. Criar provedor
curl -X POST http://localhost:4000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PG Soft",
    "externalId": "pg_soft",
    "active": true
  }'

# 2. Criar jogo
curl -X POST http://localhost:4000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 1,
    "name": "Fortune Tiger",
    "externalId": "fortune_tiger",
    "active": true
  }'

# 3. Sincronizar com PlayFivers
curl -X POST http://localhost:4000/api/games/1/sync-playfivers
```

### Fazer upload de imagem

```bash
curl -X POST http://localhost:4000/api/uploads \
  -F "file=@/caminho/para/imagem.jpg"
```

### Atualizar configurações

```bash
curl -X PUT http://localhost:4000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "branding.logoUrl": "/uploads/logo.png",
    "playfivers.agentId": "12345",
    "playfivers.token": "meu_token"
  }'
```

---

## 🔗 Integração com Frontend

Todos os endpoints da API são automaticamente proxy-invertidos pelo Vite durante o desenvolvimento.

No frontend, você pode usar:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});

// Exemplo de uso
const response = await api.get("/games");
console.log(response.data);
```

---

## 🚀 Testando a API

Use ferramentas como:
- **Postman** - https://www.postman.com
- **Insomnia** - https://insomnia.rest
- **Thunder Client** (VS Code extension)
- **curl** (linha de comando)

---

## 📊 Estrutura do Banco de Dados

### Tabela: providers
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único (auto-incremento) |
| name | TEXT | Nome do provedor |
| external_id | TEXT | ID externo (PlayFivers) |
| active | BOOLEAN | Status ativo/inativo |

### Tabela: games
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único (auto-incremento) |
| provider_id | INTEGER | Referência ao provedor |
| name | TEXT | Nome do jogo |
| external_id | TEXT | ID externo (PlayFivers) |
| active | BOOLEAN | Status ativo/inativo |

### Tabela: banners
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único (auto-incremento) |
| title | TEXT | Título do banner |
| image_url | TEXT | URL da imagem |
| link_url | TEXT | URL de destino (opcional) |
| position | INTEGER | Ordem de exibição |
| active | BOOLEAN | Status ativo/inativo |

### Tabela: settings
| Campo | Tipo | Descrição |
|-------|------|-----------|
| key | TEXT | Chave da configuração (PK) |
| value | TEXT | Valor da configuração |

---

## 🔐 Segurança

⚠️ **IMPORTANTE:** Antes de colocar em produção:

1. Adicione autenticação JWT nos endpoints administrativos
2. Valide assinaturas dos webhooks PlayFivers
3. Implemente rate limiting
4. Use HTTPS em produção
5. Sanitize todos os inputs do usuário
6. Configure CORS adequadamente

---

**Última atualização:** Dezembro 2025

