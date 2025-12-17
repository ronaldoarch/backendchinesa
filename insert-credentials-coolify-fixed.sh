#!/bin/bash
# Comando corrigido para Coolify - versão que funciona

node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
      port: parseInt(process.env.DB_PORT || '36793'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'railway'
    });
    
    console.log('✅ Conectado ao banco de dados!');
    
    await conn.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755', 'ribeirosouzafabricio15gmailcom_1765906561755']
    );
    console.log('✅ Client ID inserido/atualizado!');
    
    await conn.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      ['suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7']
    );
    console.log('✅ Client Secret inserido/atualizado!');
    
    const [rows] = await conn.query(
      'SELECT `key`, CASE WHEN `key` = ? THEN CONCAT(LEFT(`value`, 20), ?) WHEN `key` = ? THEN ? ELSE `value` END AS preview FROM settings WHERE `key` LIKE ? ORDER BY `key`',
      ['suitpay.clientId', '...', 'suitpay.clientSecret', '***', 'suitpay.%']
    );
    
    console.log('\\n📋 Credenciais no banco:');
    console.table(rows);
    console.log('\\n✅ Credenciais inseridas com sucesso!');
    console.log('🔄 Reinicie o serviço no Coolify para aplicar as mudanças.');
    
    await conn.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
"
