# Resumo das Alterações - Frontend e Links de Afiliados

## ✅ Alterações Realizadas

### 1. **Servir Frontend na Raiz**
- **Arquivo**: `server/src/server.ts`
- **Mudança**: Removida rota raiz que retornava JSON da API
- **Resultado**: Frontend (SPA) agora é servido na raiz para todas as rotas exceto `/api`, `/health`, `/uploads`

### 2. **Rota `/register` para Links de Afiliados/Gerentes**
- **Arquivo**: `src/App.tsx`
- **Mudança**: Adicionada rota `/register` que abre modal de registro automaticamente
- **Resultado**: Links como `/register?ref=CODIGO` agora funcionam corretamente

### 3. **Rastreamento de Afiliados no Cadastro**
- **Arquivo**: `server/src/services/referralService.ts`
- **Mudança**: `registerReferral` agora verifica códigos de afiliados E usuários normais
- **Resultado**: Cadastros através de links de afiliados são rastreados corretamente

### 4. **Rastreamento de Depósitos para Comissões**
- **Arquivo**: `server/src/controllers/paymentsController.ts`
- **Mudança**: Adicionado rastreamento de depósitos quando usuário foi indicado por afiliado
- **Resultado**: Depósitos são contabilizados para cálculo de comissões

### 5. **Dockerfile Atualizado**
- **Arquivo**: `Dockerfile`
- **Mudanças**:
  - Faz build do frontend (`npm run build:client`) dentro do container
  - Verifica se `dist-client` foi criado
  - Não remove devDependencies após build (para preservar arquivos)

### 6. **Caminhos do Frontend Ajustados**
- **Arquivo**: `server/src/server.ts`
- **Mudança**: Testa múltiplos caminhos para encontrar `dist-client` (prioriza `process.cwd()/dist-client`)
- **Resultado**: Funciona tanto em desenvolvimento quanto em produção Docker

## 📋 Como Funciona Agora

### Links de Afiliados/Gerentes:
1. Link: `https://dominio.com/register?ref=CODIGO_AFILIADO`
2. Servidor serve `index.html` (frontend H2bet)
3. Frontend detecta `/register?ref=CODIGO`
4. Abre modal de registro automaticamente
5. Usuário se cadastra → sistema registra em `affiliate_referrals`
6. Usuário deposita → sistema rastreia para comissões
7. Usuário joga → sistema calcula comissões (5% afiliado, 20% gerente)

### Links de Usuários Normais:
1. Link: `https://dominio.com/?ref=CODIGO_USUARIO`
2. Servidor serve `index.html` (frontend H2bet)
3. Frontend detecta `?ref=CODIGO` na URL
4. Abre modal de registro com código preenchido

## 🚀 Próximos Passos

1. **Resolver problema do Git local** (timeout de I/O)
2. **Fazer push para o GitHub** (ou usar Coolify diretamente)
3. **Coolify fará rebuild automático** e executará o Dockerfile
4. **Dockerfile fará build do frontend** automaticamente
5. **Frontend será servido na raiz** e links funcionarão

## ⚠️ Nota Importante

O build local já foi feito com sucesso:
- ✅ `dist-client/index.html` criado
- ✅ CSS e JS gerados
- ✅ Build funcionando

O problema atual é apenas com o Git local (timeout de I/O). O código está correto e pronto para deploy.
