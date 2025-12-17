# 🔐 Como Resetar Senha no Coolify

Este guia explica como resetar a senha de um usuário usando o terminal do Coolify.

## 📋 Pré-requisitos

- Acesso ao terminal do serviço backend no Coolify
- Variáveis de ambiente do banco de dados configuradas (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)

## 🚀 Comando para Resetar Senha

### 1. Acessar o Terminal do Coolify

1. No Coolify, vá até o serviço do backend
2. Clique em **"Terminal"** ou **"Shell"**
3. Aguarde o terminal carregar

### 2. Navegar para o Diretório do Projeto

```bash
cd /app
```

### 3. Executar o Script de Reset de Senha

```bash
node reset-password-coolify.js <username> <nova_senha>
```

**Exemplo para resetar senha do admin:**

```bash
node reset-password-coolify.js admin MinhaNovaSenha123
```

## 📝 Exemplos de Uso

### Resetar senha do usuário "admin"
```bash
node reset-password-coolify.js admin Admin123456
```

### Resetar senha de outro usuário
```bash
node reset-password-coolify.js joao Silva123456
```

## ✅ O que o Script Faz

1. ✅ Conecta ao banco de dados usando as variáveis de ambiente
2. ✅ Verifica se o usuário existe
3. ✅ Gera hash da nova senha com bcrypt (10 rounds)
4. ✅ Atualiza a senha no banco de dados
5. ✅ Mostra confirmação e resumo

## 🔍 Saída Esperada

```
🔌 Conectando ao banco de dados...
   Host: hopper.proxy.rlwy.net
   Port: 36793
   User: root
   Database: railway
✅ Conectado ao banco de dados!

🔍 Verificando se o usuário "admin" existe...
✅ Usuário encontrado:
   ID: 1
   Username: admin
   Admin: Sim

🔐 Gerando hash da nova senha...
✅ Hash gerado com sucesso!

💾 Atualizando senha no banco de dados...
✅ Senha atualizada com sucesso!

📋 Resumo:
   Usuário: admin
   Nova senha: MinhaNovaSenha123
   Hash: $2b$10$abcdefghijklmn...

✅ Pronto! O usuário "admin" já pode fazer login com a nova senha.

🔌 Conexão fechada.
```

## ⚠️ Importante

- **A senha será atualizada imediatamente** - não há confirmação adicional
- **Use senhas seguras** - mínimo de 6 caracteres (recomendado: 8+ com letras, números e símbolos)
- **O script valida** se o usuário existe antes de atualizar
- **As variáveis de ambiente** (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) devem estar configuradas no Coolify

## 🐛 Solução de Problemas

### Erro: "Usuário não encontrado"
- Verifique se o username está correto (case-sensitive)
- Liste os usuários no banco para confirmar o nome exato

### Erro: "Erro ao conectar ao banco de dados"
- Verifique se as variáveis de ambiente estão configuradas no Coolify
- Confirme que o banco de dados está acessível

### Erro: "Cannot find module 'bcrypt'"
- Execute: `npm install` no diretório `/app` antes de rodar o script

## 📌 Notas

- O script usa **bcrypt com 10 rounds** (mesmo padrão do sistema)
- A senha antiga **não é necessária** para resetar
- O script **não envia email** de notificação (reset direto no banco)
