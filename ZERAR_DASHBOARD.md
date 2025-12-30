# Comando para Zerar Dashboard

## Executar no Terminal do Coolify

Execute este comando no terminal do Coolify (dentro do container do backend):

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "DELETE FROM transactions; UPDATE users SET total_deposit_amount = 0, total_withdrawal_amount = 0, total_bet_amount = 0, balance = 0, bonus_balance = 0, last_deposit_at = NULL, last_withdrawal_at = NULL, last_bet_at = NULL, vip_level = 0; DELETE FROM user_bets; DELETE FROM user_bonuses; DELETE FROM user_rewards; DELETE FROM referral_bets;"
```

## Ou execute linha por linha:

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME
```

Depois execute dentro do MySQL:
```sql
DELETE FROM transactions;
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
DELETE FROM user_bets;
DELETE FROM user_bonuses;
DELETE FROM user_rewards;
DELETE FROM referral_bets;
```

## ATENÇÃO: Este comando deleta dados importantes!
