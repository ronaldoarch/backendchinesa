# 🔧 Correção dos Restarts Constantes

## Problema Identificado

O servidor estava reiniciando constantemente (18x restarts) mesmo após iniciar com sucesso.

## Causas Prováveis

1. **Tentativa de servir arquivos estáticos inexistentes**: O servidor tentava servir arquivos de `public_html` que não existem no Coolify (frontend está na Hostinger)
2. **SPA fallback causando erros**: Tentativa de servir `index.html` inexistente
3. **UncaughtException fazendo exit**: Qualquer erro não tratado crashava o servidor
4. **Health check**: O Coolify pode estar verificando saúde do container

## Correções Aplicadas

### 1. Removido serviço de arquivos estáticos do frontend
- O frontend está na Hostinger, não precisa servir arquivos estáticos no backend
- Removido `app.use(express.static(frontendDir))`
- Removido SPA fallback que tentava servir `index.html`

### 2. Melhorado tratamento de erros
- `uncaughtException` não faz mais `process.exit(1)` imediatamente
- `unhandledRejection` apenas loga, não crasha
- Erros no servidor são tratados sem crashar

### 3. Health check melhorado
- Endpoint `/health` no servidor principal
- Endpoint `/api/health` também disponível
- Resposta JSON clara: `{ ok: true, status: "healthy" }`

### 4. Rota raiz informativa
- Rota `/` agora retorna informações da API
- Não tenta servir arquivos inexistentes

### 5. Tratamento seguro de uploads
- Criação de diretório com try/catch
- Não crasha se não conseguir criar diretório

## Verificações no Coolify

Após o deploy, verifique:

1. **Health Check Path**: Configure para `/health` ou `/api/health`
2. **Porta**: Certifique-se que está usando a porta correta (4000 ou a configurada em `PORT`)
3. **Variáveis de Ambiente**: Todas as variáveis devem estar configuradas:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
   - `PORT` (opcional, padrão 4000)

## Logs Esperados

Após as correções, você deve ver:
```
✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!
✅ Servidor API rodando na porta 4000
```

E **NÃO** deve ver:
- Erros sobre arquivos não encontrados
- UncaughtException
- Restarts constantes

## Se o Problema Persistir

1. Verifique os logs completos no Coolify
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se o banco de dados no Railway está acessível
4. Verifique o health check path no Coolify
