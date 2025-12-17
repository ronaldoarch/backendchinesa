-- Script para criar um usuário administrador inicial
-- Execute este script no seu banco de dados MySQL após criar a tabela de usuários

-- IMPORTANTE: Altere a senha 'admin123' para uma senha segura em produção!
-- A senha será criptografada pelo bcrypt quando você fizer login pela primeira vez
-- ou você pode gerar o hash manualmente e inserir diretamente.

-- Opção 1: Inserir usuário admin (senha será criptografada no primeiro login)
-- Você precisará fazer o registro normalmente e depois atualizar o campo is_admin
INSERT INTO users (username, password_hash, phone, currency, is_admin) 
VALUES ('admin', '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', '+5511999999999', 'BRL', true)
ON DUPLICATE KEY UPDATE is_admin = true;

-- Opção 2: Se você já tem um usuário cadastrado, pode torná-lo admin assim:
-- UPDATE users SET is_admin = true WHERE username = 'seu_usuario';

-- NOTA: A senha padrão acima é apenas um placeholder.
-- Para criar um admin real, você tem duas opções:
-- 1. Registre um usuário normalmente pela interface, depois execute:
--    UPDATE users SET is_admin = true WHERE username = 'nome_do_usuario';
-- 2. Ou gere um hash bcrypt da senha desejada e insira diretamente no banco
