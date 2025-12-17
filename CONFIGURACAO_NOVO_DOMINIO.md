# Configuração para Novo Domínio do Frontend (h2jogos.site)

## ✅ CONFIRMADO: Backend no mesmo domínio - NÃO PRECISA MUDAR NADA!

Como o backend está no mesmo domínio, todas as configurações já estão corretas e não é necessário fazer nenhuma alteração no código.

## ✅ O que já está configurado e funcionando

1. **CORS no Backend**: Já está configurado para aceitar qualquer origem (`origin: "*"`), então o novo domínio `h2jogos.site` já será aceito automaticamente.

2. **URL da API no Frontend**: O frontend já tem fallback para a URL do backend (`https://r404c0kskws08wccgw08kk4k.agenciamidas.com/api`), então funcionará automaticamente.

3. **APP_URL no Backend**: Já está configurado corretamente para o domínio do backend.

## ⚠️ O que PRECISA ser verificado/configurado (apenas para referência futura)

### 1. **URL da API no Frontend** (Variável de Ambiente)

O frontend está configurado para usar a URL do backend via variável de ambiente ou fallback.

**Arquivo**: `src/services/api.ts`

**Configuração atual**:
- Usa `VITE_API_URL` ou `VITE_API_BASE_URL` se definido
- Fallback: `https://r404c0kskws08wccgw08kk4k.agenciamidas.com/api`

**O que fazer**:
- Se o backend continuar no mesmo domínio (`r404c0kskws08wccgw08kk4k.agenciamidas.com`), não precisa mudar nada
- Se o backend mudar de domínio, configure a variável de ambiente `VITE_API_URL` no deploy do frontend:
  ```
  VITE_API_URL=https://seu-backend-novo.com/api
  ```

### 2. **APP_URL no Backend** (Para Webhooks)

O backend usa `APP_URL` para gerar URLs de callback para webhooks (SuitPay, PlayFivers, etc.).

**Arquivo**: `env.example` e variável de ambiente no servidor

**Configuração atual**:
```
APP_URL=https://r404c0kskws08wccgw08kk4k.agenciamidas.com
```

**O que fazer**:
- Se o backend continuar no mesmo domínio, **NÃO precisa mudar** (webhooks são enviados para o backend, não para o frontend)
- Se o backend mudar de domínio, atualize a variável de ambiente `APP_URL` no servidor:
  ```
  APP_URL=https://seu-backend-novo.com
  ```

**Importante**: O `APP_URL` deve apontar para o domínio do **backend**, não do frontend, pois é usado para receber webhooks.

### 3. **Verificação de Domínios**

#### Frontend (h2jogos.site):
- ✅ CORS já permite (não precisa mudar)
- ⚠️ Verificar se `VITE_API_URL` está configurado no deploy (se necessário)

#### Backend:
- ✅ CORS já permite qualquer origem (não precisa mudar)
- ⚠️ Verificar se `APP_URL` está correto (deve apontar para o domínio do backend)

## 📋 Checklist de Deploy

- [ ] Verificar se o domínio `h2jogos.site` está totalmente configurado e propagado
- [ ] Configurar variável de ambiente `VITE_API_URL` no deploy do frontend (se o backend mudou de domínio)
- [ ] Verificar se `APP_URL` no backend está correto (deve ser o domínio do backend)
- [ ] Testar requisições da API do novo frontend
- [ ] Testar webhooks (criar um depósito e verificar se o webhook é recebido)

## 🔍 Como verificar se está funcionando

1. **Testar API do Frontend**:
   - Abrir `https://h2jogos.site` no navegador
   - Abrir DevTools (F12) → Network
   - Verificar se as requisições para `/api/*` estão sendo feitas corretamente
   - Verificar se não há erros de CORS

2. **Testar Webhooks**:
   - Criar um depósito via SuitPay
   - Verificar logs do backend para confirmar que o webhook foi recebido
   - Verificar se o callback URL está correto nos logs

## 📝 Notas Importantes

- O CORS está configurado para aceitar qualquer origem, então não há necessidade de atualizar a lista de origens permitidas
- O `APP_URL` é usado apenas para webhooks (backend → backend), não afeta o frontend
- Se ambos (frontend e backend) estiverem no mesmo domínio, pode usar o mesmo domínio para ambos
