-- ========================================
-- BigBet777 - Database Schema MySQL
-- ========================================
-- Banco de dados: u127271520_chinesa
-- Charset: utf8mb4
-- Engine: InnoDB
-- ========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ========================================
-- Tabela: providers (Provedores de Jogos)
-- ========================================

CREATE TABLE IF NOT EXISTS `providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabela: games (Jogos)
-- ========================================

CREATE TABLE IF NOT EXISTS `games` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  INDEX `idx_provider_id` (`provider_id`),
  INDEX `idx_active` (`active`),
  CONSTRAINT `fk_games_provider` FOREIGN KEY (`provider_id`) 
    REFERENCES `providers`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabela: banners (Banners Promocionais)
-- ========================================

CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image_url` TEXT NOT NULL,
  `link_url` TEXT DEFAULT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  INDEX `idx_position` (`position`),
  INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabela: settings (Configurações)
-- ========================================

CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Dados de exemplo (opcional)
-- ========================================

-- Inserir provedores de exemplo
INSERT INTO `providers` (`name`, `external_id`, `active`) VALUES
('PG Soft', 'pg_soft', 1),
('Pragmatic Play', 'pragmatic', 1),
('Evolution Gaming', 'evolution', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Inserir jogos de exemplo
INSERT INTO `games` (`provider_id`, `name`, `external_id`, `active`) VALUES
(1, 'Fortune Tiger', 'fortune_tiger', 1),
(1, 'Fortune Ox', 'fortune_ox', 1),
(1, 'Fortune Mouse', 'fortune_mouse', 1),
(2, 'Gates of Olympus', 'gates_olympus', 1),
(2, 'Sweet Bonanza', 'sweet_bonanza', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Inserir banner de exemplo
INSERT INTO `banners` (`title`, `image_url`, `link_url`, `position`, `active`) VALUES
('Bônus de Boas-Vindas', '/uploads/banner-welcome.jpg', '/promocoes', 0, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Inserir configurações padrão
INSERT INTO `settings` (`key`, `value`) VALUES
('branding.logoUrl', '/uploads/logo.png'),
('branding.faviconUrl', '/uploads/favicon.ico'),
('branding.loadingBannerUrl', '/uploads/loading.jpg'),
('playfivers.agentId', ''),
('playfivers.secret', ''),
('playfivers.token', '')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

COMMIT;

-- ========================================
-- Estrutura criada com sucesso!
-- ========================================
-- 
-- Tabelas criadas:
-- 1. providers - Provedores de jogos
-- 2. games - Catálogo de jogos
-- 3. banners - Banners promocionais
-- 4. settings - Configurações do sistema
--
-- Dados de exemplo inseridos:
-- - 3 provedores
-- - 5 jogos
-- - 1 banner
-- - 6 configurações
--
-- Pronto para uso!
-- ========================================

