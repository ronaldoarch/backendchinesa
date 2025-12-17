# Sistema de Autenticação e Autorização

## ✅ Implementação Completa

O sistema de autenticação foi implementado com sucesso! Agora você tem:

### 🔐 Funcionalidades

1. **Cadastro de Usuários**
   - Endpoint: `POST /api/auth/register`
   - Campos: username, password, phone (opcional), currency (padrão: BRL)
   - Validações: username mínimo 3 caracteres, senha mínimo 6 caracteres

2. **Login de Usuários**
   - Endpoint: `POST /api/auth/login`
   - Retorna token JWT e dados do usuário

3. **Verificação de Token**
   - Endpoint: `GET /api/auth/me`
   - Retorna dados do usuário autenticado

4. **Proteção de Rotas**
   - Rotas públicas: GET /games, GET /providers, GET /banners
   - Rotas protegidas (requerem autenticação): POST/PUT/DELETE em games, providers, banners
   - Rotas admin (requerem autenticação + is_admin): /settings, /uploads, /playfivers

### 🛡️ Segurança

- Senhas são criptografadas com bcrypt (10 rounds)
- Tokens JWT com expiração de 7 dias
- Middleware de autenticação verifica token em todas as requisições protegidas
- Middleware de autorização verifica se o usuário é admin

### 📋 Como Criar o Primeiro Usuário Admin

#### Opção 1: Via Interface (Recomendado)

1. Acesse a aplicação
2. Clique em "Registro"
3. Crie uma conta normalmente
4. Execute no banco de dados:
   ```sql
   UPDATE users SET is_admin = true WHERE username = 'seu_usuario';
   ```

#### Opção 2: Via SQL Direto

Execute o script `create-admin-user.sql` e depois atualize a senha fazendo login pela primeira vez.

### 🔧 Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
JWT_SECRET=sua-chave-secreta-super-segura-mude-em-producao
```

**IMPORTANTE**: Em produção, use uma chave secreta forte e única!

### 📱 Frontend

- O token é armazenado no `localStorage`
- Todas as requisições incluem automaticamente o token no header `Authorization: Bearer <token>`
- Rotas de admin são protegidas no frontend com o componente `ProtectedRoute`
- Se o token expirar ou for inválido, o usuário é redirecionado para a página inicial

### 🚀 Próximos Passos

1. Configure a variável `JWT_SECRET` no `.env`
2. Execute as migrações do banco (a tabela `users` será criada automaticamente)
3. Crie seu primeiro usuário admin
4. Teste o login e acesso às rotas protegidas

### 📝 Estrutura do Banco

A tabela `users` foi criada com os seguintes campos:
- `id`: INT (auto increment)
- `username`: VARCHAR(255) UNIQUE
- `password_hash`: VARCHAR(255)
- `phone`: VARCHAR(20)
- `currency`: VARCHAR(10) DEFAULT 'BRL'
- `is_admin`: BOOLEAN DEFAULT false
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### ⚠️ Notas Importantes

- Usuários normais NÃO podem acessar rotas de admin
- Apenas usuários com `is_admin = true` podem acessar `/admin/*`
- Rotas de leitura (GET) são públicas para permitir visualização de jogos/banners
- Rotas de escrita (POST/PUT/DELETE) requerem autenticação e admin
