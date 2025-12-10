# 🔑 Comando para Resetar Senha no Coolify

## ⚠️ IMPORTANTE: Aguarde o Deploy

Após fazer commit do script, aguarde o Coolify fazer o deploy (alguns minutos) para que o arquivo esteja disponível no container.

## Opção 1: Usar o Script (Após Deploy)

```bash
node reset-password-coolify.js teste teste123
```

## Opção 2: Comando Inline (Funciona Agora)

Execute este comando diretamente no terminal do Coolify:

```bash
node -e "
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
(async () => {
  const username = 'teste';
  const newPassword = 'teste123';
  const hash = await bcrypt.hash(newPassword, 10);
  const conn = await mysql.createConnection(config);
  await conn.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
  console.log('✅ Senha resetada! Username:', username, 'Senha:', newPassword);
  await conn.end();
})();
"
```

## Opção 3: SQL Direto no Railway

Se você tem acesso ao MySQL do Railway, execute:

```sql
UPDATE users 
SET password_hash = '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC'
WHERE username = 'teste';
```

**Credenciais após reset:**
- Username: `teste`
- Senha: `teste123`

## Opção 4: Criar Usuário Novo pela Interface

1. Acesse a aplicação
2. Clique em "Registro"
3. Crie uma nova conta
