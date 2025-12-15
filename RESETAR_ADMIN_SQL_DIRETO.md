# 🔑 Resetar Admin - Método SQL Direto (Mais Confiável)

Como o script Node.js está tendo problemas de autenticação, use este método SQL direto no Railway:

## ✅ Método Recomendado: SQL Direto no Railway

### 1. Acesse o Railway MySQL

1. Vá no Railway → Seu serviço MySQL
2. Clique em **"Database"** → **"Data"** → **"Query"**

### 2. Execute este SQL:

```sql
-- Resetar senha do admin (hash bcrypt para senha "admin123")
UPDATE users 
SET password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq',
    is_admin = true,
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Se o usuário não existir, criar:
INSERT INTO users (username, password_hash, currency, is_admin) 
VALUES (
    'admin', 
    '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq', 
    'BRL', 
    true
)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq',
    is_admin = true,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar se funcionou:
SELECT id, username, is_admin, created_at, updated_at 
FROM users 
WHERE username = 'admin';
```

### 3. Credenciais após reset:

- **Username:** `admin`
- **Senha:** `admin123`

### 4. Teste o login

Após executar o SQL, tente fazer login com as credenciais acima.

## 🔍 Verificar Variáveis de Ambiente no Coolify

Se quiser usar o script Node.js, verifique se as variáveis estão corretas no Coolify:

1. Vá no seu serviço backend no Coolify
2. Vá em **"Environment Variables"** ou **"Variables"**
3. Verifique se estas variáveis estão configuradas:

```env
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=23856
DB_USER=root
DB_PASSWORD=<sua_senha_do_railway>
DB_NAME=railway
```

**Importante:** Use a senha exata do `MYSQL_ROOT_PASSWORD` do Railway MySQL.

## 📝 Por que o SQL direto é melhor?

- ✅ Não depende de variáveis de ambiente
- ✅ Não precisa de conexão Node.js
- ✅ Mais rápido e direto
- ✅ Funciona sempre que você tem acesso ao Railway

