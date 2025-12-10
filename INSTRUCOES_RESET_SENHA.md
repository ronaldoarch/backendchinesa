# 🔑 Instruções para Resetar Senha

## Problema
Os logs mostram: `Login: Senha inválida para usuário admin@admin.com`

A senha que você está digitando não corresponde ao hash armazenado no banco.

## ✅ Solução Rápida

### Opção 1: Executar SQL no Railway (Mais Rápido)

1. **Acesse o MySQL no Railway:**
   - Vá no painel do Railway
   - Clique no seu banco MySQL
   - Vá em "Query" ou "MySQL Console"

2. **Execute este SQL:**
   ```sql
   UPDATE users 
   SET password_hash = '$2b$10$osF9wAcoqoNqid26WwzkLOWZpuKeLblVy9/1RupSqN6ZttdXUO/rq', 
       is_admin = true 
   WHERE username = 'admin@admin.com';
   ```

3. **Verificar:**
   ```sql
   SELECT id, username, is_admin FROM users WHERE username = 'admin@admin.com';
   ```

4. **Fazer login com:**
   - Username: `admin@admin.com`
   - Senha: `admin123`

### Opção 2: Criar Novo Usuário pela Interface

1. Acesse a aplicação
2. Clique em "Registro"
3. Crie uma nova conta (ex: `admin` / `admin123`)
4. Execute no Railway MySQL:
   ```sql
   UPDATE users SET is_admin = true WHERE username = 'admin';
   ```

### Opção 3: Usar Script Node.js (Local)

Se você tem acesso local ao projeto:

```bash
node reset-password-simple.js admin@admin.com admin123
```

## 🔍 Verificar se Funcionou

Após resetar, tente fazer login. Nos logs do Coolify deve aparecer:
```
Login: Sucesso para usuário admin@admin.com is_admin: true
POST /api/auth/login - 200
```

## 📝 Nota

O hash no script SQL é para a senha **`admin123`**. Se quiser outra senha, gere o hash em:
- https://bcrypt-generator.com/
- Ou: `node -e "const bcrypt = require('bcrypt'); bcrypt.hash('sua_senha', 10).then(console.log);"`
