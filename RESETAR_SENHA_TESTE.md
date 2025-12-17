# 🔑 Resetar Senha do Usuário "teste"

## Problema
Você está recebendo "Credenciais inválidas" mesmo com a senha correta para o usuário "teste".

## Solução: Resetar a Senha

### Opção 1: Usar Script SQL no Railway (Mais Rápido)

1. **Acesse o MySQL no Railway:**
   - Vá no painel do Railway
   - Clique no seu banco MySQL
   - Vá em "Query" ou "MySQL Console"

2. **Execute este SQL:**
   ```sql
   UPDATE users 
   SET password_hash = '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC'
   WHERE username = 'teste';
   
   -- Se o usuário não existir, criar:
   INSERT INTO users (username, password_hash, currency, is_admin) 
   VALUES ('teste', '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC', 'BRL', false)
   ON DUPLICATE KEY UPDATE 
       password_hash = '$2b$10$xtDHSyMVaq1BJcpVpcn9AO7EnLDeJPOxyKk03eL8km1IKYsWjBPKC';
   ```

3. **Fazer login com:**
   - Username: `teste`
   - Senha: `teste123`

### Opção 2: Usar Script Node.js (Local)

Se você tem acesso local ao projeto:

```bash
node reset-password-simple.js teste teste123
```

### Opção 3: Criar Novo Usuário pela Interface

1. Acesse a aplicação
2. Clique em "Registro"
3. Crie uma nova conta com username "teste" e senha "teste123"

## Verificar se Funcionou

Após resetar a senha:

1. Tente fazer login novamente
2. Verifique os logs do Coolify - deve aparecer:
   ```
   Login: Usuário encontrado { id: X, username: 'teste', ... }
   Login: Verificação de senha { isValidPassword: true, ... }
   Login: Sucesso para usuário teste
   ```

## Se Ainda Não Funcionar

1. **Verifique se o usuário existe no banco:**
   ```sql
   SELECT id, username, is_admin FROM users WHERE username = 'teste';
   ```

2. **Verifique o hash da senha:**
   ```sql
   SELECT username, password_hash FROM users WHERE username = 'teste';
   ```
   - O hash deve começar com `$2b$10$`
   - Se não começar, o hash está incorreto

3. **Verifique os logs do Coolify** para ver mensagens de debug detalhadas

## Nota

O hash no script SQL é para a senha **`teste123`**. Se quiser outra senha, gere o hash em:
- https://bcrypt-generator.com/
- Ou: `node -e "const bcrypt = require('bcrypt'); bcrypt.hash('sua_senha', 10).then(console.log);"`
