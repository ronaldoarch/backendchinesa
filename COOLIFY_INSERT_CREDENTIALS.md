# Comandos para inserir credenciais SuitPay no Coolify

## Opção 1: Via Terminal do Coolify (Recomendado)

Acesse o terminal do seu serviço no Coolify e execute:

```bash
# Conectar ao MySQL e executar os comandos SQL
mysql -h hopper.proxy.rlwy.net -P 36793 -u root -p$DB_PASSWORD railway -e "
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
```

## Opção 2: Via Node.js no Container

Se o MySQL não estiver disponível diretamente, execute via Node.js:

```bash
# No terminal do Coolify, dentro do diretório do projeto
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '36793'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway'
  });
  
  await conn.query(\`
    INSERT INTO settings (\`key\`, \`value\`)
    VALUES ('suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755')
    ON DUPLICATE KEY UPDATE \`value\` = 'ribeirosouzafabricio15gmailcom_1765906561755'
  \`);
  
  await conn.query(\`
    INSERT INTO settings (\`key\`, \`value\`)
    VALUES ('suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7')
    ON DUPLICATE KEY UPDATE \`value\` = 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7'
  \`);
  
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
  
  console.log('✅ Credenciais inseridas com sucesso!');
  console.table(rows);
  await conn.end();
})();
"
```

## Opção 3: Usando o script Node.js

Se você tiver acesso ao diretório do projeto no Coolify:

```bash
# Copiar o script para o servidor (se ainda não estiver)
# Depois executar:
node insert-suitpay-credentials.js
```

## Opção 4: Via Interface Web do Coolify (Executar Comando)

No painel do Coolify:
1. Vá para o seu serviço
2. Clique em "Execute Command" ou "Terminal"
3. Execute um dos comandos acima

## Verificar se funcionou

Após executar, verifique os logs do servidor. Você deve ver:
```
[SuitPay] Credenciais carregadas: {
  clientId: 'ribe...',
  clientSecret: '***',
  source: { ... }
}
```

## Importante

Após inserir as credenciais, **reinicie o serviço no Coolify** para que as mudanças tenham efeito.
