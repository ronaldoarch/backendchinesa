-- Script para inserir credenciais do SuitPay no banco de dados
-- Execute este script no seu banco MySQL

-- Inserir ou atualizar Client ID
INSERT INTO settings (`key`, `value`)
VALUES ('suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755')
ON DUPLICATE KEY UPDATE `value` = 'ribeirosouzafabricio15gmailcom_1765906561755';

-- Inserir ou atualizar Client Secret
INSERT INTO settings (`key`, `value`)
VALUES ('suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7')
ON DUPLICATE KEY UPDATE `value` = 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7';

-- Verificar se foram inseridas corretamente
SELECT `key`, 
       CASE 
         WHEN `key` = 'suitpay.clientId' THEN CONCAT(LEFT(`value`, 10), '...')
         WHEN `key` = 'suitpay.clientSecret' THEN '***'
         ELSE `value`
       END AS `value_preview`
FROM settings 
WHERE `key` LIKE 'suitpay.%'
ORDER BY `key`;
