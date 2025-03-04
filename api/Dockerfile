
FROM node:18-bullseye-slim

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Instalar dependências do sistema necessárias para o TDLib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gperf \
    libssl-dev \
    zlib1g-dev \
    git \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências Node.js
RUN npm ci --only=production

# Compilar TDLib da fonte com melhor gestão de erros
RUN git clone --depth 1 https://github.com/tdlib/td.git && \
    cd td && \
    mkdir -p build && \
    cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --target install -- -j$(nproc) && \
    cd ../.. && \
    rm -rf td

# Copiar o código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs tdlib-db && \
    chmod 777 logs tdlib-db

# Verificação de integridade
RUN node -e "console.log('Node.js environment is working')"

# Expor a porta da API
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
