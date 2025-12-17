# Comando Corrigido para Coolify (com backticks)

## O problema: `key` é palavra reservada no MySQL e precisa de backticks

## Comando corrigido (use este):

```bash
cd /app && node -e "const mysql=require('mysql2/promise');(async()=>{const c=await mysql.createConnection({host:process.env.DB_HOST||'hopper.proxy.rlwy.net',port:parseInt(process.env.DB_PORT||'36793'),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'railway'});await c.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',['suitpay.clientId','ribeirosouzafabricio15gmailcom_1765906561755','ribeirosouzafabricio15gmailcom_1765906561755']);await c.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',['suitpay.clientSecret','a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7','a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7']);const[r]=await c.query('SELECT `key`, CASE WHEN `key`=? THEN CONCAT(LEFT(`value`,20),?) WHEN `key`=? THEN ? ELSE `value` END AS preview FROM settings WHERE `key` LIKE ? ORDER BY `key`',['suitpay.clientId','...','suitpay.clientSecret','***','suitpay.%']);console.table(r);console.log('✅ Credenciais inseridas! Reinicie o serviço.');await c.end();})().catch(e=>{console.error('❌ Erro:',e.message);process.exit(1);});"
```

## Ou crie o arquivo (mais confiável):

```bash
cd /app && cat > insert-creds-temp.js << 'ENDOFFILE'
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '36793'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway'
  });
  
  await c.query(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
    ['suitpay.clientId', 'ribeirosouzafabricio15gmailcom_1765906561755', 'ribeirosouzafabricio15gmailcom_1765906561755']
  );
  
  await c.query(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
    ['suitpay.clientSecret', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7', 'a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7']
  );
  
  const [r] = await c.query(
    'SELECT `key`, CASE WHEN `key`=? THEN CONCAT(LEFT(`value`,20),?) WHEN `key`=? THEN ? ELSE `value` END AS preview FROM settings WHERE `key` LIKE ? ORDER BY `key`',
    ['suitpay.clientId', '...', 'suitpay.clientSecret', '***', 'suitpay.%']
  );
  
  console.table(r);
  console.log('✅ Credenciais inseridas! Reinicie o serviço.');
  await c.end();
})().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
ENDOFFILE

node insert-creds-temp.js
```

## Diferença importante:

- ❌ **Errado:** `INSERT INTO settings (key, value)`
- ✅ **Correto:** `INSERT INTO settings (`key`, `value`)`

Os backticks escapam palavras reservadas do MySQL!
