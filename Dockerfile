FROM node:22-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build do frontend)
RUN npm ci

# Copiar código fonte
COPY . .

# Fazer build do frontend ANTES de remover devDependencies
RUN npm run build:client

# Verificar se o build foi criado e listar conteúdo
RUN echo "📦 Verificando dist-client após build:" && \
    ls -la dist-client/ 2>/dev/null || echo "⚠️ dist-client não encontrado após build" && \
    echo "📦 Conteúdo de dist-client:" && \
    ls -la dist-client/ 2>/dev/null | head -20 || echo "⚠️ Não foi possível listar dist-client"

# IMPORTANTE: NÃO executar npm ci --omit=dev pois isso pode remover arquivos
# As devDependencies já foram instaladas e o build foi feito
# Manter tudo como está para produção

# Criar diretório de uploads
RUN mkdir -p server/uploads

# Expor porta
EXPOSE 4000

# Variável de ambiente para produção
ENV NODE_ENV=production

# Comando de start
CMD ["npx", "ts-node", "server/src/server.ts"]
