
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
- EasyPanel para deploy (ou Docker para execução local)

## Instalação

### Usando Docker (execução local)

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

### Deploy no EasyPanel

#### Pré-requisitos:
- Servidor com EasyPanel instalado
- Acesso ao EasyPanel via interface web
- Credenciais Telegram (api_id e api_hash)

#### Passo a passo:

1. **Obtenha credenciais do Telegram**
   - Acesse https://my.telegram.org/apps
   - Faça login com sua conta Telegram
   - Crie um novo aplicativo se necessário
   - Anote o `api_id` e `api_hash`

2. **Acesse o EasyPanel**
   - Entre no painel administrativo do EasyPanel
   - Navegue até a seção "Applications" ou "Apps"
   - Clique em "New Application" ou "Add App"

3. **Configure a nova aplicação**
   - Selecione "Deploy from Template" ou "Custom Application"
   - Escolha o método "YAML Configuration"
   - Cole o conteúdo do arquivo `easypanel.yml` no editor
   - Substitua os valores de `TELEGRAM_API_ID` e `TELEGRAM_API_HASH` pelos seus
   - Ajuste outros parâmetros como nome e tamanho de volumes conforme necessário
   - Defina uma senha forte para a variável `API_KEY` (ou deixe em branco para geração automática)

4. **Configure o build da aplicação**
   - Selecione a opção de build a partir de repositório Git
   - Informe a URL do repositório (ou faça upload do código-fonte)
   - Certifique-se de que o EasyPanel detectou o Dockerfile corretamente

5. **Inicie o deploy**
   - Clique em "Deploy" ou "Create Application"
   - Aguarde a conclusão do processo de build e deploy
   - O EasyPanel mostrará logs do processo que você pode acompanhar

6. **Verifique o status**
   - Após o deploy, acesse a URL fornecida pelo EasyPanel
   - Deve aparecer a interface da API Telegram Conduit
   - Siga o processo de autenticação na interface

7. **Configure proxies (opcional)**
   - É recomendável configurar um proxy reverso com HTTPS
   - No EasyPanel, você pode ativar o proxy HTTPS integrado
   - Alternativamente, configure Nginx ou Traefik para gerenciar o tráfego

#### Solução de problemas comuns:

- **Erro de autenticação Telegram**: Verifique se api_id e api_hash estão corretos
- **Container não inicia**: Verifique os logs do contêiner para identificar o problema
- **Problemas de permissão**: Verifique se os volumes têm permissões corretas
- **API não acessível**: Verifique as configurações de rede e firewall

## Uso

Após a inicialização, a API estará disponível em `http://seu-dominio.com` ou `http://seu-ip:3000`.

A primeira vez que você executar a API, será necessário se autenticar com sua conta do Telegram:

1. **Enviar o número de telefone**:
   ```
   curl -X POST http://seu-dominio.com/api/telegram/auth/phone \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"phone": "+5511999999999"}'
   ```

2. **Verificar o código recebido**:
   ```
   curl -X POST http://seu-dominio.com/api/telegram/auth/code \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"code": "12345"}'
   ```

3. **Se necessário, verificar a senha de dois fatores**:
   ```
   curl -X POST http://seu-dominio.com/api/telegram/auth/password \
     -H "Content-Type: application/json" \
     -H "X-API-Key: sua_api_key" \
     -d '{"password": "sua_senha"}'
   ```

## Manutenção e Atualização

Para atualizar a API no EasyPanel:

1. Acesse o painel de controle do EasyPanel
2. Localize sua aplicação na lista
3. Clique em "Rebuild" ou "Update"
4. Se necessário, atualize as configurações YAML
5. Inicie o processo de rebuild

## Monitoramento e Logs

- Os logs da aplicação são armazenados no volume `api-logs`
- Você pode visualizar os logs pelo painel do EasyPanel
- Para depuração avançada, acesse os logs diretamente:
  ```
  docker logs -f telegram-conduit-api
  ```

## Segurança

Esta API é destinada para uso em MVPs e ambientes de desenvolvimento. Para ambientes de produção, considere:

1. Implementar autenticação mais robusta
2. Adicionar HTTPS (obrigatório)
3. Implementar limites de taxa mais rigorosos
4. Adicionar validação de entrada mais completa
5. Implementar registro de auditoria
6. Configurar backups regulares da pasta tdlib-db

## Licença

MIT
