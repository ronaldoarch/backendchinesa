# 🔑 Como Resetar Senha de Usuário

## Problema Identificado

Os logs mostram: `Login: Senha inválida para usuário admin@admin.com`

Isso significa que a senha digitada não corresponde ao hash armazenado no banco de dados.

## Solução: Resetar a Senha

### Opção 1: Usar Script Node.js (Recomendado)

1. **Execute o script:**
   ```bash
   node reset-password.js admin@admin.com nova_senha_aqui
   ```

2. **Exemplo:**
   ```bash
   node reset-password.js admin@admin.com admin123
   ```

3. **O script irá:**
   - Gerar o hash bcrypt da nova senha
   - Atualizar no banco de dados
   - Confirmar se foi atualizado

### Opção 2: Criar Novo Usuário pela Interface

1. Acesse a aplicação
2. Clique em "Registro"
3. Crie uma nova conta com username e senha de sua escolha
4. Execute no banco de dados (Railway):
   ```sql
   UPDATE users SET is_admin = true WHERE username = 'seu_novo_usuario';
   ```

### Opção 3: Gerar Hash Manualmente e Atualizar no Banco

1. **Gere o hash bcrypt:**
   - Use: https://bcrypt-generator.com/
   - Ou execute no Node.js:
     ```javascript
     const bcrypt = require('bcrypt');
     bcrypt.hash('sua_senha', 10).then(console.log);
     ```

2. **Execute no banco (Railway):**
   ```sql
   UPDATE users 
   SET password_hash = 'HASH_GERADO_AQUI' 
   WHERE username = 'admin@admin.com';
   ```

## Verificar se Funcionou

Após resetar a senha:

1. Tente fazer login novamente
2. Verifique os logs do Coolify - deve aparecer:
   ```
   Login: Sucesso para usuário admin@admin.com is_admin: true
   POST /api/auth/login - 200
   ```

## Nota Importante

- A senha é criptografada com bcrypt (10 rounds)
- Não é possível ver a senha original, apenas resetá-la
- Use senhas fortes em produção
