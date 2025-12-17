# Instruções para Commit

## ✅ Resposta: NÃO precisa fazer build do backend

O projeto está configurado para rodar TypeScript diretamente usando `ts-node`, tanto em desenvolvimento quanto em produção (Railway/Coolify).

## 📝 O que fazer:

### 1. Verificar se tudo está funcionando localmente:
```bash
npm install  # Instalar novas dependências (bcrypt, jsonwebtoken)
npm run dev  # Testar localmente
```

### 2. Fazer commit dos arquivos:

```bash
# Adicionar todos os arquivos modificados e novos
git add .

# Ou adicionar seletivamente:
git add package.json package-lock.json
git add server/src/
git add src/
git add AUTENTICACAO.md create-admin-user.sql

# Fazer commit
git commit -m "feat: Implementar sistema completo de autenticação e autorização

- Adicionar tabela de usuários no banco de dados
- Criar endpoints de autenticação (register, login, me)
- Implementar middleware de autenticação e autorização (admin)
- Proteger rotas de admin no backend e frontend
- Atualizar AuthModal para suportar login e registro
- Adicionar componente ProtectedRoute para proteger rotas
- Configurar interceptors de API para gerenciar tokens
- Adicionar dependências: bcrypt, jsonwebtoken"
```

### 3. Push para o repositório:
```bash
git push origin main
```

## ⚠️ Importante:

- **NÃO commitar** `dist-server/` (já está no .gitignore)
- **NÃO commitar** `.env` (já está no .gitignore)
- **SIM, commitar** todos os arquivos `.ts` em `server/src/`
- **SIM, commitar** `package.json` e `package-lock.json` (novas dependências)

## 🚀 Em produção:

O servidor rodará automaticamente com:
```bash
npx ts-node server/src/server.ts
```

Conforme configurado no `nixpacks.toml` e no script `start` do `package.json`.
