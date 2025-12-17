# 🏗️ Arquitetura do Sistema - BigBet777

## 📐 Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                      USUÁRIO FINAL                       │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Vite Dev Server (localhost:5173)                 │  │
│  │  - React 18 + TypeScript                          │  │
│  │  - React Router DOM                               │  │
│  │  - Axios para HTTP                                │  │
│  │  - CSS customizado                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  Páginas:                                                │
│  • HomePage         • PromotionsPage                     │
│  • DepositPage      • ProfilePage                        │
│  • SupportPage      • AdminPage                          │
│  • AdminDashboard   • AdminBranding                      │
│  • AdminPlayfivers  • AdminBanners                       │
│  • AdminUsers       • AdminDeposits                      │
└─────────────────────────────────────────────────────────┘
                            │
                            │ /api/* (proxy)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Node.js Server (localhost:4000)                  │  │
│  │  - Express 4                                      │  │
│  │  - TypeScript                                     │  │
│  │  - CORS                                           │  │
│  │  - Multer (uploads)                               │  │
│  │  - Zod (validação)                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  Rotas da API:                                           │
│  • /api/health                                           │
│  • /api/providers      (GET, POST, PUT, DELETE)          │
│  • /api/games          (GET, POST, sync)                 │
│  • /api/banners        (GET, POST, DELETE)               │
│  • /api/settings       (GET, PUT)                        │
│  • /api/uploads        (POST)                            │
│  • /api/playfivers/*   (webhook)                         │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│   PostgreSQL     │ │   Uploads    │ │  PlayFivers API │
│   (Railway)      │ │  (Filesystem)│ │   (Externo)     │
│                  │ │              │ │                 │
│  • providers     │ │ /uploads/    │ │  Integração de  │
│  • games         │ │  - Imagens   │ │  jogos e        │
│  • banners       │ │  - Logos     │ │  provedores     │
│  • settings      │ │  - Favicons  │ │                 │
└──────────────────┘ └──────────────┘ └─────────────────┘
```

---

## 🔄 Fluxo de Dados

### 1. Fluxo de Exibição de Jogos

```
┌──────────┐      GET /api/games      ┌──────────┐
│ HomePage │ ───────────────────────> │ Backend  │
│  (React) │                          │ (Express)│
└──────────┘                          └──────────┘
     ▲                                      │
     │                                      │ SQL Query
     │                                      ▼
     │     JSON Response              ┌──────────┐
     └──────────────────────────────  │ Postgres │
                                       └──────────┘
```

### 2. Fluxo de Upload de Arquivo

```
┌──────────────┐   FormData   ┌──────────┐   Multer   ┌──────────┐
│ AdminBranding│ ───────────> │ Backend  │ ─────────> │ Uploads/ │
│    (React)   │              │ (Express)│            │   Folder │
└──────────────┘              └──────────┘            └──────────┘
      ▲                             │
      │                             │ Save URL
      │        { url: "/..." }      ▼
      └────────────────────────  ┌──────────┐
                                  │ Postgres │
                                  │ settings │
                                  └──────────┘
```

### 3. Fluxo de Sincronização PlayFivers

```
┌──────────────┐   POST sync   ┌──────────┐   HTTP    ┌──────────┐
│ AdminPlayfive│ ────────────> │ Backend  │ ────────> │PlayFivers│
│  rs (React)  │               │ (Service)│           │   API    │
└──────────────┘               └──────────┘           └──────────┘
      ▲                             │                       │
      │                             │ Get game data         │
      │                             ▼                       │
      │        Success/Error   ┌──────────┐                │
      └──────────────────────  │ Postgres │ <──────────────┘
                                └──────────┘  Callback
```

---

## 🗂️ Estrutura de Pastas Detalhada

```
chinesa/
│
├── 📂 src/                          # Frontend React
│   ├── App.tsx                      # Componente raiz
│   ├── main.tsx                     # Entry point
│   ├── styles.css                   # Estilos globais
│   │
│   ├── 📂 components/               # Componentes reutilizáveis
│   │   ├── AuthModal.tsx            # Modal de login/registro
│   │   ├── GameCard.tsx             # Card de jogo
│   │   └── SideMenu.tsx             # Menu lateral
│   │
│   └── 📂 pages/                    # Páginas da aplicação
│       ├── HomePage.tsx             # Página inicial
│       ├── PromotionsPage.tsx       # Promoções e bônus
│       ├── DepositPage.tsx          # Depósito PIX
│       ├── ProfilePage.tsx          # Perfil do usuário
│       ├── SupportPage.tsx          # Suporte
│       ├── AdminPage.tsx            # Layout do admin
│       │
│       └── 📂 admin/                # Páginas administrativas
│           ├── AdminDashboardPage.tsx      # Dashboard
│           ├── AdminBrandingPage.tsx       # Logo/Favicon
│           ├── AdminPlayfiversPage.tsx     # PlayFivers
│           ├── AdminBannersPage.tsx        # Banners
│           ├── AdminUsersPage.tsx          # Usuários
│           └── AdminDepositsPage.tsx       # Depósitos
│
├── 📂 server/                       # Backend Express
│   ├── index.ts                     # Servidor principal
│   ├── db.ts                        # Configuração PostgreSQL
│   │
│   ├── 📂 routes/                   # Rotas da API
│   │   ├── providers.ts             # CRUD Provedores
│   │   ├── games.ts                 # CRUD Jogos
│   │   ├── banners.ts               # CRUD Banners
│   │   ├── settings.ts              # CRUD Settings
│   │   └── uploads.ts               # Upload de arquivos
│   │
│   ├── 📂 services/                 # Serviços externos
│   │   └── playfivers.ts            # API PlayFivers
│   │
│   └── 📂 uploads/                  # Arquivos enviados
│       ├── (logos)
│       ├── (favicons)
│       └── (banners)
│
├── 📂 node_modules/                 # Dependências
│
├── 📄 package.json                  # Configuração npm
├── 📄 tsconfig.json                 # Configuração TypeScript
├── 📄 vite.config.mts               # Configuração Vite
├── 📄 index.html                    # HTML base
├── 📄 env.d.ts                      # Tipos para env vars
│
├── 📄 .env                          # Variáveis de ambiente (não versionado)
├── 📄 env.example                   # Exemplo de .env
├── 📄 .gitignore                    # Arquivos ignorados
│
└── 📂 Documentação/
    ├── README.md                    # Documentação principal
    ├── INICIO_RAPIDO.md             # Guia de início
    ├── API_DOCS.md                  # Documentação da API
    ├── FUNCIONALIDADES.md           # Lista de features
    ├── CHECKLIST_FINAL.md           # Checklist de verificação
    └── ARQUITETURA.md               # Este arquivo
```

---

## 🔌 Endpoints da API

### Provedores
```
GET     /api/providers           # Listar todos
POST    /api/providers           # Criar novo
PUT     /api/providers/:id       # Atualizar
DELETE  /api/providers/:id       # Deletar
```

### Jogos
```
GET     /api/games               # Listar todos
POST    /api/games               # Criar novo
POST    /api/games/:id/sync-playfivers  # Sincronizar
```

### Banners
```
GET     /api/banners             # Listar todos
POST    /api/banners             # Criar novo
DELETE  /api/banners/:id         # Deletar
```

### Configurações
```
GET     /api/settings            # Obter todas
PUT     /api/settings            # Atualizar (upsert)
```

### Upload
```
POST    /api/uploads             # Upload de arquivo
```

### Outros
```
GET     /api/health              # Health check
POST    /api/playfivers/callback # Webhook PlayFivers
```

---

## 🗄️ Modelo de Dados

### Tabela: providers
```sql
CREATE TABLE providers (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  external_id  TEXT,
  active       BOOLEAN NOT NULL DEFAULT true
);
```

### Tabela: games
```sql
CREATE TABLE games (
  id           SERIAL PRIMARY KEY,
  provider_id  INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  external_id  TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true
);
```

### Tabela: banners
```sql
CREATE TABLE banners (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true
);
```

### Tabela: settings
```sql
CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
```

**Configurações comuns:**
- `branding.logoUrl`
- `branding.faviconUrl`
- `branding.loadingBannerUrl`
- `playfivers.agentId`
- `playfivers.secret`
- `playfivers.token`

---

## 🚀 Pipeline de Deploy

### Desenvolvimento
```
┌──────────┐     npm run dev      ┌──────────────┐
│ Terminal │ ─────────────────> │ Concurrently │
└──────────┘                     └──────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                                     ▼
            ┌───────────────┐                   ┌─────────────┐
            │  Vite Server  │                   │ Node Server │
            │  Port: 5173   │                   │  Port: 4000 │
            └───────────────┘                   └─────────────┘
```

### Produção
```
┌──────────┐   build   ┌──────────┐   deploy   ┌──────────┐
│  Vite    │ ────────> │   dist/  │ ─────────> │  Vercel  │
│  Build   │           │  Files   │            │ Netlify  │
└──────────┘           └──────────┘            └──────────┘

┌──────────┐   build   ┌──────────┐   deploy   ┌──────────┐
│   Node   │ ────────> │  Server  │ ─────────> │ Railway  │
│   TS     │           │   .js    │            │  Heroku  │
└──────────┘           └──────────┘            └──────────┘
```

---

## 🔐 Fluxo de Autenticação (Atual - Demo)

```
┌──────────┐              ┌──────────┐
│  Usuário │ Click Login  │ Frontend │
│          │ ────────────> │          │
└──────────┘              └──────────┘
                               │
                               │ Abre modal
                               ▼
                          ┌──────────┐
                          │AuthModal │
                          │ (Form)   │
                          └──────────┘
                               │
                               │ Preenche dados
                               ▼
                          ┌──────────┐
                          │  Submit  │
                          │  (Demo)  │
                          └──────────┘
                               │
                               │ setState
                               ▼
                          ┌──────────┐
                          │ Usuário  │
                          │ Logado   │
                          └──────────┘
```

**Nota:** Para produção, implementar autenticação JWT real.

---

## 📊 Tecnologias Utilizadas

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **React Router DOM** - Roteamento
- **Axios** - Cliente HTTP
- **Vite** - Build tool
- **CSS Custom** - Estilização

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **Zod** - Validação de schemas
- **Multer** - Upload de arquivos
- **dotenv** - Variáveis de ambiente

### DevOps
- **ts-node-dev** - Hot reload
- **Concurrently** - Executar múltiplos processos
- **Git** - Controle de versão

---

## 🎯 Padrões de Projeto Utilizados

### Frontend
- **Component-Based Architecture** - Componentes reutilizáveis
- **Container/Presentational** - Separação de lógica e UI
- **Custom Hooks** - useState, useEffect
- **Controlled Components** - Forms controlados

### Backend
- **RESTful API** - Arquitetura REST
- **MVC Pattern** - Separação de responsabilidades
- **Service Layer** - Lógica de negócio isolada
- **Repository Pattern** - Acesso a dados

---

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
PORT=4000
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_API_KEY=your_api_key_here
```

### Frontend
```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
```

---

## 📈 Performance

### Frontend
- ✅ Code splitting por rota
- ✅ React SWC (fast refresh)
- ✅ Assets otimizados
- ✅ CSS minificado

### Backend
- ✅ Connection pooling (PostgreSQL)
- ✅ Gzip compression
- ✅ Static file serving
- ✅ Async/await

---

## 🎉 Conclusão

O sistema está arquitetado de forma modular, escalável e de fácil manutenção. Cada parte do sistema tem responsabilidades bem definidas e pode ser desenvolvida/testada independentemente.

**Pontos fortes da arquitetura:**
- ✅ Separação clara entre frontend e backend
- ✅ API RESTful bem definida
- ✅ Componentes React reutilizáveis
- ✅ TypeScript em todo o código
- ✅ Validação de dados em múltiplas camadas
- ✅ Estrutura de pastas intuitiva
- ✅ Documentação completa

