-- Script de migração para adicionar coluna image_url na tabela games
-- Execute este script no seu banco de dados MySQL se a coluna não existir

-- Verificar se a coluna existe antes de adicionar
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'games' 
  AND COLUMN_NAME = 'image_url'
);

-- Adicionar coluna apenas se não existir
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE games ADD COLUMN image_url TEXT',
  'SELECT "Coluna image_url já existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
