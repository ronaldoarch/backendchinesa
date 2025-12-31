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

# Fazer build do frontend
RUN npm run build:client

# Instalar apenas dependências de produção (após o build)
RUN npm ci --omit=dev

# Criar diretório de uploads
RUN mkdir -p server/uploads

# Expor porta
EXPOSE 4000

# Variável de ambiente para produção
ENV NODE_ENV=production

# Comando de start
CMD ["npx", "ts-node", "server/src/server.ts"]
