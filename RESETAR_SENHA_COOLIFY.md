# 🔑 Resetar Senha via Coolify

## Como Executar no Coolify

### Opção 1: Via Terminal do Coolify (Recomendado)

1. **Acesse o Coolify:**
   - Vá no painel do Coolify
   - Encontre seu serviço/container do backend
   - Clique em "Terminal" ou "Console"

2. **Execute o comando:**
   ```bash
   node reset-password-coolify.js teste teste123
   ```

   Ou para outro usuário:
   ```bash
   node reset-password-coolify.js admin@admin.com admin123
   ```

3. **O script irá:**
   - Conectar ao banco usando as variáveis de ambiente
   - Gerar o hash bcrypt da nova senha
   - Atualizar ou criar o usuário
   - Mostrar confirmação

### Opção 2: Via SSH no Servidor

Se você tem acesso SSH ao servidor onde o Coolify está rodando:

1. **Conecte via SSH:**
   ```bash
   ssh seu-usuario@seu-servidor
   ```

2. **Navegue até o diretório do projeto:**
   ```bash
   cd /caminho/do/projeto
   ```

3. **Execute o script:**
   ```bash
   node reset-password-coolify.js teste teste123
   ```

### Opção 3: Via Docker Exec (Se o container estiver rodando)

1. **Encontre o ID do container:**
   ```bash
   docker ps | grep seu-backend
   ```

2. **Execute o script dentro do container:**
   ```bash
   docker exec -it <container-id> node reset-password-coolify.js teste teste123
   ```

## Exemplos de Uso

### Resetar senha do usuário "teste":
```bash
node reset-password-coolify.js teste teste123
```

### Resetar senha do admin:
```bash
node reset-password-coolify.js admin@admin.com admin123
```

### Criar novo usuário:
```bash
node reset-password-coolify.js novo_usuario senha123
```

## Verificar Variáveis de Ambiente

O script usa estas variáveis de ambiente (já configuradas no Coolify):
- `DB_HOST` - Host do banco de dados
- `DB_PORT` - Porta do banco (padrão: 3306)
- `DB_USER` - Usuário do banco
- `DB_PASSWORD` - Senha do banco
- `DB_NAME` - Nome do banco

Se alguma estiver faltando, o script mostrará um erro.

## Saída Esperada

```
🔄 Resetando senha para: teste
   Nova senha: teste123
   DB Host: seu-host
   DB Name: seu-banco
   Gerando hash da senha...
✅ Senha resetada com sucesso!
   Usuário ID: 1
   É admin: Não

📝 Agora você pode fazer login com:
   Username: teste
   Senha: teste123
```

## Troubleshooting

### Erro: "Variáveis de ambiente do banco não configuradas"
- Verifique se as variáveis estão configuradas no Coolify
- Vá em "Environment Variables" no serviço

### Erro: "ECONNREFUSED" ou "Cannot connect to database"
- Verifique se o banco está acessível
- Verifique se as credenciais estão corretas
- Verifique se o banco está no mesmo network do Coolify

### Erro: "Access denied"
- Verifique se o usuário do banco tem permissões
- Verifique se a senha está correta

## Nota

O script usa as mesmas variáveis de ambiente que o backend usa, então se o backend está funcionando, o script também deve funcionar.
