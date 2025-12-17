# 🔒 Solução para Erro 403 (Acesso Negado)

## Problema

Você está recebendo erro **403 (Forbidden)** ao tentar acessar rotas de admin, mesmo estando logado como administrador.

## Causa

O token JWT foi gerado **antes** das correções de `is_admin`. Mesmo que você seja admin no banco de dados, o token antigo ainda contém `is_admin: false` ou `0` no payload.

## ✅ Solução

**Faça logout e login novamente** para gerar um novo token com o valor correto de `is_admin`.

### Passos:

1. **Clique em "SAIR" (Logout)** na interface
2. **Faça login novamente** com suas credenciais
3. **Tente acessar `/admin` novamente**

## Como Verificar

Após fazer login novamente, verifique nos logs do Coolify:

```
Login: Sucesso para usuário [seu_usuario] {
  userId: X,
  is_admin_from_db: true,
  is_admin_type: 'boolean',
  token_generated: true
}
```

E quando acessar uma rota admin, deve aparecer:

```
Authenticate middleware: {
  userId: X,
  username: '...',
  is_admin_from_token: true,
  is_admin_type: 'boolean',
  userIsAdmin: true
}
RequireAdmin middleware: {
  userId: X,
  userIsAdmin: true,
  isAdmin: true,
  path: '/settings',
  method: 'GET'
}
✅ Acesso permitido - usuário é admin
```

## Se Ainda Não Funcionar

1. **Verifique no banco de dados** se `is_admin = 1` para seu usuário:
   ```sql
   SELECT id, username, is_admin FROM users WHERE username = 'seu_usuario';
   ```

2. **Limpe o localStorage** manualmente:
   - Abra o console do navegador (F12)
   - Execute:
     ```javascript
     localStorage.clear();
     ```
   - Recarregue a página e faça login novamente

3. **Verifique os logs do Coolify** para ver o que está sendo logado nos middlewares

## Nota Importante

Os tokens JWT têm validade de **7 dias**. Se você fez login antes das correções, o token antigo ainda será válido até expirar. Por isso é necessário fazer logout/login para gerar um novo token.
