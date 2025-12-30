-- Script para zerar o dashboard
-- ATENÇÃO: Este script irá deletar dados importantes!
-- Execute apenas se tiver certeza de que deseja resetar todas as estatísticas.

-- 1. Deletar todas as transações (depósitos e saques)
DELETE FROM transactions;

-- 2. Zerar totais dos usuários
UPDATE users SET 
  total_deposit_amount = 0,
  total_withdrawal_amount = 0,
  total_bet_amount = 0,
  balance = 0,
  bonus_balance = 0,
  last_deposit_at = NULL,
  last_withdrawal_at = NULL,
  last_bet_at = NULL,
  vip_level = 0;

-- 3. Deletar apostas (se a tabela existir)
DELETE FROM user_bets;

-- 4. Deletar bônus (se a tabela existir)
DELETE FROM user_bonuses;

-- 5. Deletar recompensas resgatadas (se a tabela existir)
DELETE FROM user_rewards;

-- 6. Deletar histórico de indicações (se a tabela existir)
DELETE FROM referral_bets;

-- Verificar resultado
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COALESCE(SUM(total_deposit_amount), 0) FROM users) as total_deposits,
  (SELECT COALESCE(SUM(total_withdrawal_amount), 0) FROM users) as total_withdrawals,
  (SELECT COALESCE(SUM(total_bet_amount), 0) FROM users) as total_bets;
