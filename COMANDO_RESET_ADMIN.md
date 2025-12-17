# 🔑 Comando para Resetar Admin no Coolify Terminal

## Execute este comando diretamente no terminal do Coolify:

```bash
node -e "
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dbConfig = {
  host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT || '23856'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway'
};
(async () => {
  const username = process.argv[1] || 'admin';
  const password = process.argv[2] || 'admin123';
  console.log('🔄 Resetando senha do admin...');
  console.log('   Username:', username);
  console.log('   Senha:', password);
  const connection = await mysql.createConnection(dbConfig);
  const hash = await bcrypt.hash(password, 10);
  await connection.query(
    'INSERT INTO users (username, password_hash, currency, is_admin) VALUES (?, ?, \"BRL\", true) ON DUPLICATE KEY UPDATE password_hash = ?, is_admin = true, updated_at = CURRENT_TIMESTAMP',
    [username, hash, hash]
  );
  const [result] = await connection.query('SELECT id, username, is_admin FROM users WHERE username = ?', [username]);
  console.log('✅ Sucesso!', result[0]);
  console.log('📝 Login com:', username, '/', password);
  await connection.end();
})();
" admin admin123
```

## Versão mais simples (copie e cole tudo de uma vez):

```bash
node -e "const bcrypt=require('bcrypt');const mysql=require('mysql2/promise');(async()=>{const c=await mysql.createConnection({host:process.env.DB_HOST||'shortline.proxy.rlwy.net',port:parseInt(process.env.DB_PORT||'23856'),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'railway'});const h=await bcrypt.hash('admin123',10);await c.query('INSERT INTO users(username,password_hash,currency,is_admin)VALUES(?,?,\"BRL\",true)ON DUPLICATE KEY UPDATE password_hash=?,is_admin=true',['admin',h,h]);const[r]=await c.query('SELECT id,username,is_admin FROM users WHERE username=?',['admin']);console.log('✅ Admin criado:',r[0]);console.log('📝 Login: admin / admin123');await c.end();})();"
```

## Ou use este comando mais legível (multilinha):

```bash
node << 'EOF'
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

(async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT || '23856'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway'
  };
  
  const username = 'admin';
  const password = 'admin123';
  
  console.log('🔄 Resetando senha do admin...');
  
  const connection = await mysql.createConnection(dbConfig);
  const hash = await bcrypt.hash(password, 10);
  
  await connection.query(
    `INSERT INTO users (username, password_hash, currency, is_admin) 
     VALUES (?, ?, 'BRL', true)
     ON DUPLICATE KEY UPDATE 
       password_hash = ?,
       is_admin = true,
       updated_at = CURRENT_TIMESTAMP`,
    [username, hash, hash]
  );
  
  const [result] = await connection.query(
    'SELECT id, username, is_admin FROM users WHERE username = ?',
    [username]
  );
  
  console.log('✅ Sucesso!', result[0]);
  console.log('📝 Login com:', username, '/', password);
  
  await connection.end();
})();
EOF
```

## Após executar:

- **Username:** `admin`
- **Senha:** `admin123`

Tente fazer login novamente!

