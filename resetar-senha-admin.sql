-- Script para resetar senha do admin no Railway MySQL
-- Execute este SQL no Railway MySQL → Database → Data → Query

-- Hash bcrypt válido para senha "admin123" (10 rounds)
-- Este hash foi gerado e testado: $2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq

-- Atualizar senha do usuário admin
UPDATE users 
SET password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq',
    is_admin = true,
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Verificar se foi atualizado
SELECT 
    id, 
    username, 
    LEFT(password_hash, 20) as hash_preview,
    is_admin, 
    created_at,
    updated_at 
FROM users 
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

-- Credenciais após reset:
-- Username: admin
-- Senha: admin123

