# 📋 Documentação Completa das Implementações - Casino Chinês

Este documento descreve todas as funcionalidades implementadas no sistema de cassino online.

---

## 🎯 Índice

1. [Sistema de Autenticação e Admin](#1-sistema-de-autenticação-e-admin)
2. [Integração de Gateway de Pagamento](#2-integração-de-gateway-de-pagamento)
3. [Página de Perfil do Usuário](#3-página-de-perfil-do-usuário)
4. [Exibição de Saldo em Tempo Real](#4-exibição-de-saldo-em-tempo-real)
5. [Carrossel de Banners Promocionais](#5-carrossel-de-banners-promocionais)
6. [Dashboard Administrativo](#6-dashboard-administrativo)
7. [Sistema de Tracking e Analytics](#7-sistema-de-tracking-e-analytics)
8. [Sistema de Bônus e VIP](#8-sistema-de-bônus-e-vip)
9. [Responsividade](#9-responsividade)

---

## 1. Sistema de Autenticação e Admin

### 1.1 Criação de Usuário Admin

**Problema Inicial:** A tabela `users` estava vazia, impedindo login.

**Solução Implementada:**

#### Opção 1: Script SQL

```sql
-- resetar-senha-admin.sql
UPDATE users
SET password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq',
    is_admin = true,
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';
```

**Credenciais padrão:**
- Username: `admin`
- Senha: `admin123`

#### Opção 2: Script Node.js Backend

```bash
npm run reset-admin
```

**Arquivo:** `reset-admin-backend.js`
- Conecta ao MySQL usando variáveis de ambiente
- Cria usuário admin se não existir
- Atualiza senha se já existir
- Usa bcrypt para hash da senha

### 1.2 Endpoints de Autenticação

**Backend (`server/src/routes/auth.ts`):**
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de novo usuário
- `GET /api/auth/me` - Obter dados do usuário logado
- `PUT /api/auth/profile` - Atualizar perfil do usuário
- `PUT /api/auth/password` - Alterar senha

**Campos retornados no login:**
- `username`, `id`, `balance`, `email`, `phone`, `document`, `is_admin`

---

## 2. Integração de Gateway de Pagamento

### 2.1 SuitPay - Gateway Principal

**Gateway Implementado:** SuitPay como único gateway de pagamento

#### 2.1.1 Configuração

**Página Admin:** `/admin/suitpay`

**Credenciais necessárias:**
- Client ID (`ci`) - Obtido no portal SuitPay
- Client Secret (`cs`) - Obtido no portal SuitPay

**Como obter credenciais:**
1. Acesse o portal SuitPay
2. Vá em: VENDAS → GATEWAY DE PAGAMENTO → Chaves API
3. Gere uma nova chave API
4. Copie o Client ID e Client Secret
5. Configure no admin do sistema

**Ambientes:**
- Sandbox: `http://sandbox.w.suitpay.app`
- Produção: `http://w.suitpay.app`

**Armazenamento:**
- Credenciais salvas na tabela `settings` com chaves:
  - `suitpay.clientId`
  - `suitpay.clientSecret`

#### 2.1.2 Depósitos (PIX)

**Endpoint:** `POST /api/payments/pix`

**Fluxo:**
1. Usuário informa valor do depósito
2. Sistema valida dados obrigatórios (email, documento, telefone)
3. Gera `requestNumber` único (UUID)
4. Cria transação no banco de dados com status `PENDING`
5. Faz requisição para API SuitPay (`POST /pix`)
6. Recebe QR Code PIX (base64 ou URL)
7. Exibe QR Code para o usuário
8. Aguarda confirmação via webhook

**Request Body:**
```json
{
  "amount": 100.00,
  "dueDate": "2024-12-13", // Opcional, padrão: 1 dia
  "client": {
    "name": "Nome do Cliente",
    "document": "12345678900", // CPF/CNPJ (opcional)
    "email": "cliente@email.com", // Opcional
    "phone": "11999999999" // Opcional
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "requestNumber": "uuid-gerado",
    "transactionId": "tx-suitpay-123",
    "qrCode": "00020126...",
    "qrCodeBase64": "iVBORw0KGgoAAAANS...",
    "amount": 100.00,
    "dueDate": "2024-12-13",
    "status": "PENDING"
  }
}
```

**Tabela:** `transactions`
- Campos: `id`, `user_id`, `request_number`, `transaction_id`, `payment_method`, `amount`, `status`, `qr_code`, `qr_code_base64`, `due_date`, `callback_url`, `metadata`, `created_at`, `updated_at`

#### 2.1.3 Depósitos (Cartão)

**Endpoint:** `POST /api/payments/card`

**Request Body:**
```json
{
  "amount": 100.00,
  "card": {
    "number": "4111111111111111",
    "expirationMonth": "12",
    "expirationYear": "2025",
    "cvv": "123",
    "holderName": "NOME DO PORTADOR" // Opcional
  },
  "client": {
    "name": "Nome do Cliente",
    "document": "12345678900", // Opcional
    "email": "cliente@email.com", // Opcional
    "phone": "11999999999" // Opcional
  },
  "installments": 1 // Opcional, padrão: 1
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "requestNumber": "uuid-gerado",
    "transactionId": "tx-suitpay-123",
    "amount": 100.00,
    "status": "PENDING",
    "message": "Pagamento processado"
  }
}
```

#### 2.1.4 Depósitos (Boleto)

**Endpoint:** `POST /api/payments/boleto`

**Request Body:**
```json
{
  "amount": 100.00,
  "dueDate": "2024-12-20", // Obrigatório
  "client": {
    "name": "Nome do Cliente",
    "document": "12345678900", // Obrigatório para boleto
    "email": "cliente@email.com", // Opcional
    "phone": "11999999999", // Opcional
    "address": { // Opcional
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234567"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "requestNumber": "uuid-gerado",
    "transactionId": "tx-suitpay-123",
    "barcode": "34191...",
    "digitableLine": "34191.79001 01234.567890 12345.678901 2 98760000010000",
    "amount": 100.00,
    "dueDate": "2024-12-20",
    "status": "PENDING"
  }
}
```

#### 2.1.5 Consulta de Transação

**Endpoint:** `GET /api/payments/transactions/:requestNumber`

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "requestNumber": "uuid-gerado",
  "transactionId": "tx-suitpay-123",
  "paymentMethod": "PIX",
  "amount": 100.00,
  "status": "PAID_OUT",
  "qrCode": "...",
  "createdAt": "2024-12-12T10:00:00Z",
  "updatedAt": "2024-12-12T10:05:00Z"
}
```

#### 2.1.6 Cancelamento de Transação

**Endpoint:** `POST /api/payments/transactions/:requestNumber/cancel`

**Validações:**
- Transação deve estar com status `PENDING`
- Usuário deve ser o dono da transação

**Response:**
```json
{
  "success": true,
  "message": "Transação cancelada com sucesso"
}
```

#### 2.1.7 Webhook SuitPay

**Endpoint:** `POST /api/payments/webhook`

**Validações:**
- IP esperado: `3.132.137.46` (logado, mas não bloqueado se diferente)
- Hash SHA-256 obrigatório para validação de integridade

**Processamento:**
1. Valida hash SHA-256 do webhook
2. Busca transação pelo `requestNumber`
3. Atualiza status da transação
4. Se status `PAID_OUT`:
   - Atualiza saldo do usuário
   - Aplica bônus automático (se configurado)
   - Dispara eventos de tracking
5. Se status `CHARGEBACK`:
   - Reverte saldo do usuário

**Status de transação:**
- `PENDING` - Aguardando pagamento
- `PAID_OUT` - Pago/Confirmado
- `CANCELED` - Cancelado
- `CHARGEBACK` - Estorno

**Validação de Hash:**
Conforme documentação SuitPay:
1. Concatene todos os valores dos campos (exceto hash) em ordem original
2. Concatene Client Secret com o resultado da etapa 1
3. Calcule SHA-256 da string resultante
4. Compare com o hash recebido

**Exemplo de Webhook:**
```json
{
  "requestNumber": "uuid-gerado",
  "transactionId": "tx-suitpay-123",
  "statusTransaction": "PAID_OUT",
  "amount": 100.00,
  "hash": "sha256-hash-aqui"
}
```

### 2.2 Correção de QR Code

**Problema:** QR Code não aparecia na página de depósito

**Causa:** Duplicação do prefixo `data:image/png;base64,`

**Solução:** Verificação inteligente do formato antes de renderizar:

```typescript
let imageSrc = transaction.qrCodeBase64;
if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
  imageSrc = imageSrc;
} else if (imageSrc.startsWith("data:image")) {
  imageSrc = imageSrc;
} else {
  imageSrc = `data:image/png;base64,${imageSrc}`;
}
```

---

## 3. Página de Perfil do Usuário

### 3.1 Funcionalidades Implementadas

**Arquivo:** `src/pages/ProfilePage.tsx`

**Exibição de dados:**
- Username
- ID do usuário
- Saldo atual (formatado em BRL)
- Email
- Telefone
- Documento (CPF/CNPJ)

### 3.2 Edição de Dados Pessoais

**Modal de edição:**
- Campos editáveis: Email, Telefone, Documento
- Validação de formato
- Atualização via API `PUT /api/auth/profile`
- Feedback visual de sucesso/erro

**Validações:**
- Email válido
- Telefone no formato brasileiro
- Documento (CPF/CNPJ) válido

### 3.3 Alteração de Senha

**Modal de alteração:**
- Campo de senha atual
- Campo de nova senha
- Confirmação de nova senha
- Validação de força da senha
- Atualização via API `PUT /api/auth/password`

**Backend (`server/src/services/authService.ts`):**
- `updateUserProfile()` - Atualiza dados do perfil
- `updateUserPassword()` - Atualiza senha com hash bcrypt

---

## 4. Exibição de Saldo em Tempo Real

### 4.1 Header com Saldo

**Arquivo:** `src/App.tsx`

**Funcionalidades:**
- Exibe saldo formatado: `R$ 1.234,56`
- Atualização automática a cada 30 segundos
- Atualização ao focar na janela (evento `focus`)
- Atualização após ações que alteram saldo (depósito, saque)

**Endpoint utilizado:** `GET /api/auth/me`

**Formatação:**
```typescript
const formatBalance = (balance: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(balance);
};
```

---

## 5. Carrossel de Banners Promocionais

### 5.1 Implementação

**Arquivo:** `src/pages/HomePage.tsx`

**Funcionalidades:**
- Carrossel automático (troca a cada 5 segundos)
- Navegação manual (setas esquerda/direita)
- Indicadores de página (dots)
- Suporte a gestos touch (swipe) em mobile
- Transições suaves entre banners
- Loop infinito

**Estrutura de dados:**
```typescript
interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  active: boolean;
}
```

**Controles:**
- Botões de navegação (anterior/próximo)
- Dots clicáveis para pular para banner específico
- Pausa automática ao passar mouse
- Retoma ao remover mouse

---

## 6. Dashboard Administrativo

### 6.1 Estatísticas em Tempo Real

**Arquivo:** `src/pages/admin/AdminDashboardPage.tsx`

**Backend:** `server/src/services/statsService.ts`

**Métricas exibidas:**
- Total de Usuários
- Total de Depósitos (R$)
- Total de Saques (R$)
- Total Apostado (R$)
- Bônus Distribuídos (R$)
- Lucro Líquido (R$)

**Endpoint:** `GET /api/stats/dashboard`

**Queries SQL:**
- Contagem de usuários ativos
- Soma de transações por tipo
- Cálculo de lucro (depósitos - saques - bônus)

### 6.2 Design Melhorado

**Características:**
- Cards coloridos com ícones
- Cores diferenciadas por métrica
- Layout responsivo em grid
- Animações suaves
- Formatação de valores em BRL

**Cores:**
- Usuários: Azul
- Depósitos: Verde
- Saques: Laranja
- Apostas: Roxo
- Bônus: Amarelo
- Lucro: Verde escuro

---

## 7. Sistema de Tracking e Analytics

### 7.1 Webhooks Configuráveis

**Arquivo:** `src/pages/admin/AdminTrackingPage.tsx`

**Funcionalidades:**
- Adicionar múltiplos webhooks
- Configurar URL do webhook
- Habilitar/desabilitar webhooks
- Selecionar eventos para rastrear

**Eventos disponíveis:**
- `user_registered` - Novo usuário registrado
- `user_login` - Usuário fez login
- `deposit_created` - Depósito criado
- `deposit_paid` - Depósito confirmado
- `withdrawal_created` - Saque criado
- `withdrawal_paid` - Saque processado
- `bonus_applied` - Bônus aplicado
- `bet_placed` - Aposta realizada

**Backend:** `server/src/services/trackingService.ts`
- `dispatchEvent()` - Envia evento para todos os webhooks ativos
- Suporte a múltiplos webhooks simultâneos
- Retry automático em caso de falha
- Logging de eventos

**Tabela:** `webhooks`
- Campos: `id`, `url`, `enabled`, `events` (JSON), `created_at`, `updated_at`

### 7.2 Facebook Pixel

**Arquivo:** `src/components/FacebookPixel.tsx`

**Funcionalidades:**
- Carregamento dinâmico do script do Pixel
- Configuração via admin (`facebookPixelId`)
- Eventos automáticos:
  - `PageView` - Visualização de página
  - `CompleteRegistration` - Registro completo
  - `Purchase` - Compra/Depósito
  - `AddPaymentInfo` - Adição de informação de pagamento

**Configuração:**
- Acesse `/admin/tracking`
- Insira o ID do Facebook Pixel
- Salve as configurações

**Eventos disparados:**
```typescript
fbq('track', 'PageView');
fbq('track', 'CompleteRegistration', { value: 0, currency: 'BRL' });
fbq('track', 'Purchase', { value: amount, currency: 'BRL' });
```

### 7.3 UTMfy Integration

**Arquivo:** `src/components/UtmfyTracker.tsx`

**Funcionalidades:**
- Captura de parâmetros UTM da URL
- Envio automático para API UTMfy
- Rastreamento de origem de tráfego
- Configuração via admin (`utmfyApiKey`)

**Parâmetros capturados:**
- `utm_source` - Origem do tráfego
- `utm_medium` - Meio de comunicação
- `utm_campaign` - Campanha
- `utm_term` - Termo de busca
- `utm_content` - Conteúdo específico

**Configuração:**
- Acesse `/admin/tracking`
- Insira a API Key do UTMfy
- Salve as configurações

**Tabela:** `settings`
- Campos: `key`, `value`, `updated_at`
- Chaves: `facebookPixelId`, `utmfyApiKey`

---

## 8. Sistema de Bônus e VIP

### 8.1 Estrutura de Banco de Dados

**Tabelas criadas:**

#### `bonuses`

```sql
CREATE TABLE bonuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('first_deposit', 'deposit', 'vip_level', 'custom') NOT NULL,
  bonus_percentage DECIMAL(5,2) DEFAULT 0,
  bonus_fixed DECIMAL(10,2) DEFAULT 0,
  min_deposit DECIMAL(10,2) DEFAULT 0,
  max_bonus DECIMAL(10,2) NULL,
  rollover_multiplier DECIMAL(5,2) DEFAULT 1,
  rtp_percentage DECIMAL(5,2) DEFAULT 96,
  vip_level_required INT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `user_bonuses`

```sql
CREATE TABLE user_bonuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bonus_id INT NOT NULL,
  transaction_id INT NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  rollover_required DECIMAL(10,2) NOT NULL,
  rollover_completed DECIMAL(10,2) DEFAULT 0,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bonus_id) REFERENCES bonuses(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
```

#### `user_bets`

```sql
CREATE TABLE user_bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_id VARCHAR(255) NOT NULL,
  bet_amount DECIMAL(10,2) NOT NULL,
  win_amount DECIMAL(10,2) DEFAULT 0,
  rtp_used DECIMAL(5,2) DEFAULT 96,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Colunas adicionadas em `users`:**
- `vip_level` INT DEFAULT 0
- `total_bet_amount` DECIMAL(10,2) DEFAULT 0
- `total_deposit_amount` DECIMAL(10,2) DEFAULT 0
- `total_withdrawal_amount` DECIMAL(10,2) DEFAULT 0
- `total_bonus_amount` DECIMAL(10,2) DEFAULT 0
- `last_deposit_at` TIMESTAMP NULL
- `last_bet_at` TIMESTAMP NULL
- `last_withdrawal_at` TIMESTAMP NULL

### 8.2 Tipos de Bônus

#### 8.2.1 Primeiro Depósito (`first_deposit`)
- Aplicado automaticamente no primeiro depósito do usuário
- Exemplo: 100% de bônus (depositou R$ 100, ganha R$ 200 total)

#### 8.2.2 Depósito Geral (`deposit`)
- Aplicado em qualquer depósito
- Pode ter condições (valor mínimo, máximo)

#### 8.2.3 VIP (`vip_level`)
- Aplicado apenas para usuários de nível VIP específico
- Requer nível VIP mínimo configurado

#### 8.2.4 Personalizado (`custom`)
- Bônus com regras específicas
- Configurável pelo admin

### 8.3 Sistema de Rollover

**Conceito:**
- Rollover = valor que o usuário precisa apostar antes de poder sacar
- Fórmula: `rollover_required = (deposit_amount + bonus_amount) * rollover_multiplier`

**Exemplo:**
- Depósito: R$ 100
- Bônus: R$ 100 (100%)
- Multiplicador: 1x
- Rollover necessário: R$ 200
- Usuário precisa apostar R$ 200 antes de poder sacar

**Verificação no saque:**
```typescript
const canUserWithdraw = async (userId: number, amount: number) => {
  // Busca bônus ativos do usuário
  // Verifica se rollover foi completado
  // Retorna true/false
};
```

**Backend:** `server/src/services/bonusService.ts`
- `applyBonusToDeposit()` - Aplica bônus ao depósito
- `checkRolloverRequirement()` - Verifica rollover
- `updateRolloverProgress()` - Atualiza progresso do rollover

### 8.4 Sistema de RTP (Return to Player)

**Conceito:**
- RTP = porcentagem de retorno ao jogador
- Configurável por bônus (padrão: 96%)
- Afeta o cálculo de ganhos nas apostas

**Implementação:**
- Cada bônus tem um `rtp_percentage`
- Cada aposta registra o `rtp_used`
- Cálculo de ganhos considera o RTP

**Tabela:** `user_bets`
- Campo `rtp_used` armazena o RTP aplicado na aposta

### 8.5 Página Admin de Bônus

**Arquivo:** `src/pages/admin/AdminBonusesPage.tsx`

**Funcionalidades:**
- Criar novo bônus
- Editar bônus existente
- Deletar bônus
- Ativar/desativar bônus
- Visualizar lista de bônus

**Campos do formulário:**
- Nome do bônus
- Tipo (primeiro depósito, depósito, VIP, personalizado)
- Porcentagem de bônus (%)
- Valor fixo de bônus (R$)
- Depósito mínimo (R$)
- Bônus máximo (R$)
- Multiplicador de rollover
- RTP (%)
- Nível VIP requerido (se tipo VIP)
- Status (ativo/inativo)

**Endpoints Backend:**
- `GET /api/bonuses` - Listar todos os bônus
- `POST /api/bonuses` - Criar novo bônus
- `PUT /api/bonuses/:id` - Atualizar bônus
- `DELETE /api/bonuses/:id` - Deletar bônus

**Backend:** `server/src/controllers/bonusController.ts`
**Rotas:** `server/src/routes/bonuses.ts`

### 8.6 Integração com Depósitos

**Arquivo:** `server/src/controllers/paymentsController.ts`

**Fluxo:**
1. Webhook SuitPay confirma depósito pago
2. Sistema busca bônus elegíveis para o usuário
3. Aplica bônus automaticamente (se houver)
4. Cria registro em `user_bonuses`
5. Atualiza saldo do usuário (depósito + bônus)
6. Dispara evento de tracking `bonus_applied`

**Critérios de elegibilidade:**
- Bônus ativo
- Tipo compatível (first_deposit, deposit, vip_level)
- Valor mínimo atingido
- Nível VIP (se aplicável)
- Primeiro depósito (se tipo first_deposit)

### 8.7 Página VIP

**Arquivo:** `src/pages/PromotionsPage.tsx`

**Funcionalidades:**
- Exibe nível VIP atual do usuário
- Mostra progresso para próximo nível
- Lista benefícios de cada nível
- Botão "Receber Tudo" (para bônus VIP)

**Níveis VIP:**
- Bronze (0-999)
- Prata (1000-4999)
- Ouro (5000-9999)
- Platina (10000-49999)
- Diamante (50000+)

**Cálculo de nível:**
- Baseado em `total_deposit_amount` + `total_bet_amount`

**Backend:** `server/src/services/bonusService.ts`
- `getUserVipLevel()` - Calcula nível VIP do usuário
- `getVipProgress()` - Calcula progresso para próximo nível

---

## 9. Responsividade

### 9.1 Admin Responsivo

**Arquivos modificados:**
- `src/styles.css` - Media queries para admin
- `src/pages/admin/*.tsx` - Componentes adaptados

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Ajustes implementados:**
- Menu lateral vira hambúrguer em mobile
- Tabelas com scroll horizontal
- Formulários em coluna única em mobile
- Cards em grid responsivo
- Botões com tamanho adequado para touch

**Componentes responsivos:**
- `AdminDashboardPage.tsx`
- `AdminBonusesPage.tsx`
- `AdminTrackingPage.tsx`
- `AdminSuitPayPage.tsx`
- Menu de navegação admin

### 9.2 CSS Media Queries

```css
@media (max-width: 768px) {
  .admin-container {
    padding: 8px;
  }
  
  .admin-table {
    font-size: 12px;
  }
  
  .admin-form-group {
    margin-bottom: 12px;
  }
}
```

---

## 🔧 Configuração e Deploy

### Variáveis de Ambiente Backend

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=chinesa_cassino
JWT_SECRET=seu_jwt_secret

# SuitPay
SUITPAY_CLIENT_ID=seu_client_id
SUITPAY_CLIENT_SECRET=seu_client_secret
SUITPAY_ENV=production # ou sandbox
SUITPAY_SANDBOX_URL=http://sandbox.w.suitpay.app
SUITPAY_PRODUCTION_URL=http://w.suitpay.app

# App URL (para webhooks)
APP_URL=https://seu-dominio.com
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend e backend
npm run dev:client       # Apenas frontend
npm run dev:server       # Apenas backend

# Build
npm run build:client     # Build do frontend
npm run build:server     # Build do backend

# Admin
npm run reset-admin      # Resetar senha do admin

# Deploy
git push origin main     # Push para repositório
```

### Estrutura de Pastas

```
chinesa/
├── server/                 # Backend Node.js/Express
│   ├── src/
│   │   ├── config/         # Configurações (database, etc)
│   │   ├── controllers/    # Controllers das rotas
│   │   ├── services/       # Lógica de negócio
│   │   │   ├── suitpayService.ts  # Serviço SuitPay
│   │   │   └── ...
│   │   ├── routes/         # Definição de rotas
│   │   │   ├── payments.ts # Rotas de pagamento
│   │   │   └── ...
│   │   └── server.ts       # Arquivo principal
│   └── package.json
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   │   ├── admin/          # Páginas administrativas
│   │   │   ├── AdminSuitPayPage.tsx
│   │   │   └── ...
│   │   ├── DepositPage.tsx
│   │   └── ...
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Entry point
├── dist-client/            # Build do frontend (upload para Hostinger)
└── package.json
```

---

## 📝 Notas Importantes

### Segurança
- Senhas sempre hasheadas com bcrypt
- JWT para autenticação
- Validação de dados no backend
- Sanitização de inputs
- Validação de hash SHA-256 nos webhooks SuitPay
- Verificação de IP do webhook (logado)

### Performance
- Queries SQL otimizadas
- Índices nas tabelas principais
- Cache de configurações quando possível
- Lazy loading de componentes

### Manutenção
- Logs detalhados no backend
- Tratamento de erros consistente
- Mensagens de erro amigáveis
- Validações tanto no frontend quanto backend

---

## 🚀 Próximos Passos Sugeridos

1. **Sistema de Jogos:**
   - Integração com provedores de jogos (PlayFivers já implementado)
   - Histórico de apostas detalhado
   - Sistema de torneios

2. **Notificações:**
   - Notificações push
   - Email transacional
   - SMS para saques

3. **Relatórios:**
   - Relatórios financeiros detalhados
   - Análise de comportamento do usuário
   - Exportação de dados

4. **Segurança Avançada:**
   - 2FA (autenticação de dois fatores)
   - Verificação de documentos (KYC)
   - Limites de saque por período

5. **Marketing:**
   - Sistema de afiliados
   - Campanhas promocionais
   - Programa de fidelidade

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do backend
2. Consulte a documentação da API SuitPay: https://api.suitpay.app/
3. Verifique as variáveis de ambiente
4. Confirme que todas as migrations foram executadas
5. Teste a conexão SuitPay em `/admin/suitpay`

---

**Última atualização:** Dezembro 2024
**Versão do sistema:** 1.0.0
**Gateway de Pagamento:** SuitPay
