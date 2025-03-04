
# Telegram Conduit API

API simples para conectar o Telegram com o N8N, permitindo recuperação de mensagens e arquivos.

## Características

- Autenticação simplificada com o Telegram
- Recuperação de mensagens de chats privados e grupos
- Download de arquivos e mídia
- Integração fácil com o N8N

## Requisitos

- Node.js 14+ ou Docker
- Credenciais Telegram (api_id e api_hash) de https://my.telegram.org/apps

## Instalação

### Usando Docker (recomendado)

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/telegram-conduit-api.git
   cd telegram-conduit-api
   ```

2. Configure as credenciais do Telegram no arquivo `docker-compose.yml`:
   ```yaml
   environment:
     - TELEGRAM_API_ID=your_api_id
     - TELEGRAM_API_HASH=your_api_hash
   ```

3. Inicie o contêiner:
   ```
   docker-compose up -d
   ```

### Instalação Manual

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/telegram-conduit-api.git
   cd telegram-conduit-api
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Instale o TDLib seguindo as instruções em: https://github.com/tdlib/td#building

4. Configure as variáveis de ambiente:
   ```
   export TELEGRAM_API_ID=your_api_id
   export TELEGRAM_API_HASH=your_api_hash
   ```

5. Inicie a aplicação:
   ```
   npm start
   ```

## Uso

Após a inicialização, a API estará disponível em `http://localhost:3000`.

A primeira vez que você executar a API, será necessário se autenticar com sua conta do Telegram:

1. **Enviar o número de telefone**:
   ```
   curl -X POST http://localhost:3000/api/telegram/auth/phone \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"phone": "+5511999999999"}'
   ```

2. **Verificar o código recebido**:
   ```
   curl -X POST http://localhost:3000/api/telegram/auth/code \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"code": "12345"}'
   ```

3. **Se necessário, verificar a senha de dois fatores**:
   ```
   curl -X POST http://localhost:3000/api/telegram/auth/password \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"password": "sua_senha"}'
   ```

## Endpoints da API

### Autenticação

- `POST /api/telegram/auth/phone` - Envia código para número de telefone
- `POST /api/telegram/auth/code` - Verifica código recebido
- `POST /api/telegram/auth/password` - Verifica senha de dois fatores
- `GET /api/telegram/auth/status` - Verifica status de autenticação

### Chats

- `GET /api/chats` - Lista todos os chats
- `GET /api/chats/:chatId` - Obtém detalhes de um chat
- `GET /api/chats/:chatId/messages` - Lista mensagens de um chat

### Mensagens

- `GET /api/messages/:messageId` - Obtém detalhes de uma mensagem

### Arquivos

- `GET /api/files/:fileId/info` - Obtém informações sobre um arquivo
- `GET /api/files/:fileId/download` - Baixa um arquivo

### Status

- `GET /api/status` - Verifica status da API

## Integração com N8N

Para usar esta API com o N8N:

1. Adicione um nó "HTTP Request" no seu workflow
2. Configure a URL para apontar para o endpoint da API
3. Adicione o cabeçalho `X-API-Key` com a sua chave API
4. Configure o método (GET, POST, etc) e o corpo da requisição conforme necessário

## Segurança

Esta API é destinada apenas para uso em MVPs e ambientes de desenvolvimento. Para ambientes de produção, considere:

1. Implementar autenticação mais robusta
2. Adicionar HTTPS
3. Implementar limites de taxa mais rigorosos
4. Adicionar validação de entrada mais completa

## Licença

MIT
