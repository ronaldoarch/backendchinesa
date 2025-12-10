-- Script para resetar senha no Railway MySQL
-- Execute este script no MySQL do Railway

-- IMPORTANTE: Este hash é para a senha "admin123"
-- Se quiser outra senha, gere o hash em: https://bcrypt-generator.com/
-- Ou use: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('sua_senha', 10).then(console.log);"

-- Hash para senha "admin123" (gerado com bcrypt)
UPDATE users 
SET password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq', 
    is_admin = true 
WHERE username = 'admin@admin.com';

-- Se o usuário não existir, criar:
INSERT INTO users (username, password_hash, currency, is_admin) 
VALUES ('admin@admin.com', '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq', 'BRL', true)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq',
    is_admin = true;

-- Verificar se foi atualizado:
SELECT id, username, is_admin FROM users WHERE username = 'admin@admin.com';

-- Credenciais após reset:
-- Username: admin@admin.com
-- Senha: admin123
