-- Script SQL para resetar senha de um usuário
-- IMPORTANTE: Este script requer que você gere o hash bcrypt manualmente
-- OU use o script Node.js reset-password.js

-- Para gerar o hash bcrypt, você pode:
-- 1. Usar o script Node.js: node reset-password.js admin@admin.com nova_senha
-- 2. Ou usar uma ferramenta online: https://bcrypt-generator.com/
-- 3. Ou executar no Node.js: const bcrypt = require('bcrypt'); bcrypt.hash('sua_senha', 10).then(console.log)

-- Exemplo: Resetar senha para "admin123"
-- Substitua o hash abaixo pelo hash gerado para sua senha
UPDATE users 
SET password_hash = '$2b$10$YOUR_HASH_AQUI' 
WHERE username = 'admin@admin.com';

-- Para tornar o usuário admin também:
UPDATE users 
SET is_admin = true 
WHERE username = 'admin@admin.com';

-- Verificar se foi atualizado:
SELECT id, username, is_admin FROM users WHERE username = 'admin@admin.com';
