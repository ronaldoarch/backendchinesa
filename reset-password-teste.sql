-- Script para resetar senha do usuário "teste"
-- Execute este script no MySQL do Railway

-- Hash para senha "teste123" (gerado com bcrypt)
UPDATE users 
SET password_hash = '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC', 
    is_admin = false 
WHERE username = 'teste';

-- Se o usuário não existir, criar:
INSERT INTO users (username, password_hash, currency, is_admin) 
VALUES ('teste', '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC', 'BRL', false)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC',
    is_admin = false;

-- Verificar se foi atualizado:
SELECT id, username, is_admin FROM users WHERE username = 'teste';

-- IMPORTANTE: Substitua $2b$10$YOUR_HASH_AQUI pelo hash gerado
-- Execute: node reset-password-simple.js teste teste123
