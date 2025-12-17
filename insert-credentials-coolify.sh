#!/bin/bash
# Script para inserir credenciais SuitPay no banco via Coolify
# Execute: bash insert-credentials-coolify.sh

echo "🔌 Conectando ao banco de dados..."

# Usar variáveis de ambiente do Coolify ou valores padrão
DB_HOST="${DB_HOST:-hopper.proxy.rlwy.net}"
DB_PORT="${DB_PORT:-36793}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-railway}"

# Verificar se DB_PASSWORD está definida
if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Erro: DB_PASSWORD não está definida nas variáveis de ambiente"
  echo "💡 Configure a variável DB_PASSWORD no Coolify antes de executar este script"
  exit 1
fi

# Comando SQL
SQL_COMMANDS="
INSERT INTO settings (\`key\`, \`value\`)
VALUES ('suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755')
ON DUPLICATE KEY UPDATE \`value\` = 'ribeirosouzafabricio15gmailcom_1765906561755';

INSERT INTO settings (\`key\`, \`value\`)
VALUES ('suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7')
ON DUPLICATE KEY UPDATE \`value\` = 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7';

SELECT \`key\`, 
       CASE 
         WHEN \`key\` = 'suitpay.clientId' THEN CONCAT(LEFT(\`value\`, 20), '...')
         WHEN \`key\` = 'suitpay.clientSecret' THEN '*** (oculto)'
         ELSE \`value\`
       END AS \`value_preview\`
FROM settings 
WHERE \`key\` LIKE 'suitpay.%'
ORDER BY \`key\`;
"

# Tentar executar via mysql client (se disponível)
if command -v mysql &> /dev/null; then
  echo "📊 Usando cliente MySQL..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$SQL_COMMANDS"
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Credenciais inseridas com sucesso!"
    echo "🔄 Reinicie o serviço no Coolify para aplicar as mudanças."
  else
    echo "❌ Erro ao executar comandos SQL"
    exit 1
  fi
else
  # Fallback: usar Node.js
  echo "📊 Cliente MySQL não encontrado, usando Node.js..."
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
      
      await conn.query(\`
        INSERT INTO settings (\`key\`, \`value\`)
        VALUES ('suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755')
        ON DUPLICATE KEY UPDATE \`value\` = 'ribeirosouzafabricio15gmailcom_1765906561755'
      \`);
      console.log('✅ Client ID inserido/atualizado!');
      
      await conn.query(\`
        INSERT INTO settings (\`key\`, \`value\`)
        VALUES ('suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7')
        ON DUPLICATE KEY UPDATE \`value\` = 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7'
      \`);
      console.log('✅ Client Secret inserido/atualizado!');
      
      const [rows] = await conn.query(\`
        SELECT \`key\`, 
               CASE 
                 WHEN \`key\` = 'suitpay.clientId' THEN CONCAT(LEFT(\`value\`, 20), '...')
                 WHEN \`key\` = 'suitpay.clientSecret' THEN '*** (oculto)'
                 ELSE \`value\`
               END AS \`value_preview\`
        FROM settings 
        WHERE \`key\` LIKE 'suitpay.%'
        ORDER BY \`key\`
      \`);
      
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
fi
