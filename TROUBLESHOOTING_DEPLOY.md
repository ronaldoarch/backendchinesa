# 🔧 Troubleshooting: Erro no Deploy do Coolify

## Problema

O deploy está falhando durante o `npm install` com exit code 255.

## Correções Aplicadas

1. ✅ **Atualizado Node.js para versão 22** (conforme o Coolify está usando)
2. ✅ **Mudado de `npm ci --omit=dev` para `npm install --production=false`** (para instalar todas as dependências, incluindo devDependencies necessárias para ts-node)

## Se o Problema Persistir

### 1. Verificar Logs Completos

No Coolify, clique em "Show Debug Logs" para ver o erro completo do `npm install`.

### 2. Possíveis Causas

#### A. Timeout no npm install
- **Solução**: Aumentar o timeout no Coolify ou otimizar dependências

#### B. Memória insuficiente
- **Solução**: Aumentar recursos do container no Coolify

#### C. Dependência específica falhando
- **Solução**: Verificar qual dependência está causando o problema nos logs

#### D. Problema com package-lock.json
- **Solução**: Regenerar o package-lock.json:
  ```bash
  rm package-lock.json
  npm install
  git add package-lock.json
  git commit -m "Regenerar package-lock.json"
  git push
  ```

### 3. Alternativa: Usar Dockerfile Customizado

Se o nixpacks continuar falhando, você pode criar um `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Expor porta
EXPOSE 4000

# Comando de start
CMD ["npx", "ts-node", "server/src/server.ts"]
```

### 4. Verificar Variáveis de Ambiente

Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas no Coolify:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `PORT` (opcional, padrão: 4000)

### 5. Limpar Cache do Build

No Coolify:
1. Vá em "Advanced"
2. Clique em "Clear Build Cache"
3. Tente fazer deploy novamente

## Próximos Passos

1. **Aguarde o novo deploy** com as correções aplicadas
2. **Verifique os logs** se ainda falhar
3. **Se necessário**, implemente uma das soluções acima

## Nota

O `nixpacks.toml` agora está configurado para:
- Node.js 22 (conforme o Coolify)
- `npm install --production=false` (instala todas as dependências, incluindo devDependencies necessárias para ts-node)
