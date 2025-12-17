# 🔑 Resetar Senha do Admin pelo Backend

## Como usar

### Opção 1: Executar localmente (com .env configurado)

```bash
# Resetar senha do admin (padrão: admin/admin123)
npm run reset-admin

# Ou especificar username e senha
node reset-admin-backend.js admin minha_senha_segura
```

### Opção 2: Executar no Coolify (via terminal)

1. **Acesse o terminal do serviço no Coolify:**
   - Vá no seu serviço backend no Coolify
   - Clique em "Terminal" ou "Console"
   - Ou use SSH se configurado

2. **Execute o comando:**
   ```bash
   node reset-admin-backend.js admin admin123
   ```

### Opção 3: Executar via Docker (se estiver usando Docker)

```bash
# Entrar no container
docker exec -it <nome_do_container> sh

# Executar o script
node reset-admin-backend.js admin admin123
```

## Variáveis de Ambiente Necessárias

O script usa as mesmas variáveis do backend:

```env
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=23856
DB_USER=root
DB_PASSWORD=sua_senha_do_railway
DB_NAME=railway
```

## Exemplos de Uso

```bash
# Resetar senha do admin padrão
npm run reset-admin

# Criar/resetar usuário específico
node reset-admin-backend.js admin minha_senha_123

# Criar outro usuário admin
node reset-admin-backend.js superadmin senha_super_segura
```

## O que o script faz

1. ✅ Conecta ao banco MySQL usando as variáveis de ambiente
2. ✅ Verifica se o usuário existe
3. ✅ Gera hash bcrypt da senha (10 rounds)
4. ✅ Cria ou atualiza o usuário
5. ✅ Define `is_admin = true`
6. ✅ Mostra informações do usuário criado/atualizado

## Credenciais Padrão

Após executar sem parâmetros:
- **Username:** `admin`
- **Senha:** `admin123`

## Troubleshooting

### Erro: "DB_PASSWORD não configurado"
- Configure a variável `DB_PASSWORD` no `.env` ou nas variáveis de ambiente do Coolify

### Erro: "ECONNREFUSED" ou timeout
- Verifique se `DB_HOST` e `DB_PORT` estão corretos
- Verifique se o MySQL do Railway está online

### Erro: "Access denied"
- Verifique se `DB_USER` e `DB_PASSWORD` estão corretos
- Use as credenciais do Railway MySQL

## Verificar se Funcionou

Após executar, tente fazer login:
- Username: o que você especificou (ou `admin` por padrão)
- Senha: a senha que você especificou (ou `admin123` por padrão)

Nos logs do backend deve aparecer:
```
Login: Sucesso para usuário admin is_admin: true
```

