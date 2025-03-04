
const express = require('express');
const cors = require('cors');
const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-addon');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuração do ambiente
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || generateApiKey(); // Gerar uma chave API se não existir
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../tdlib-db');
const LOG_FILE = path.join(__dirname, '../logs/api.log');

// Garantir que os diretórios existam
fs.mkdirSync(DB_PATH, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

// Configuração do logger
const logger = require('./utils/logger');

// App Express
const app = express();

// Middleware de segurança e configuração
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(cors()); // Permitir CORS para todas as origens
app.use(express.json()); // Parse de JSON
app.use(morgan('combined', { stream: fs.createWriteStream(LOG_FILE, { flags: 'a' }) })); // Logging
app.use(morgan('dev')); // Logging para console

// Rate limiting - limitar tentativas de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limitar cada IP a 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Cliente TDLib
const client = new Client(new TDLib(path.resolve(__dirname, '../tdlib/libtdjson')), {
  apiId: process.env.TELEGRAM_API_ID || 'YOUR_TELEGRAM_API_ID',
  apiHash: process.env.TELEGRAM_API_HASH || 'YOUR_TELEGRAM_API_HASH',
  databaseDirectory: DB_PATH,
  filesDirectory: path.join(DB_PATH, 'files'),
});

// Estado da autenticação
let authState = {
  isAuthenticated: false,
  authorizationState: null,
  phoneNumber: null,
  awaitingCode: false,
  awaitingPassword: false,
};

// Middleware para validar API Key
const validateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  
  if (!providedKey || providedKey !== API_KEY) {
    logger.warn(`Tentativa de acesso com API Key inválida: ${providedKey}`);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'API Key inválida ou ausente'
      }
    });
  }
  
  next();
};

// Middleware para validar autenticação do Telegram
const validateTelegramAuth = (req, res, next) => {
  if (!authState.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Não autenticado no Telegram'
      }
    });
  }
  
  next();
};

// Inicializar cliente TDLib e responder a eventos
client.on('update', update => {
  console.log('Recebido update:', update._;
  
  if (update._ === 'updateAuthorizationState') {
    authState.authorizationState = update.authorization_state._;
    
    // Processar mudanças no estado de autorização
    handleAuthorizationStateUpdate(update.authorization_state);
  }
});

async function handleAuthorizationStateUpdate(authorizationState) {
  console.log('Estado de autorização atualizado:', authorizationState._);
  
  switch (authorizationState._) {
    case 'authorizationStateWaitTdlibParameters':
      // Nada a fazer, o cliente já envia os parâmetros do tdlib
      break;
      
    case 'authorizationStateWaitEncryptionKey':
      await client.invoke({
        _: 'checkDatabaseEncryptionKey',
        encryption_key: ''
      });
      break;
      
    case 'authorizationStateWaitPhoneNumber':
      authState.awaitingCode = false;
      authState.awaitingPassword = false;
      authState.isAuthenticated = false;
      break;
      
    case 'authorizationStateWaitCode':
      authState.awaitingCode = true;
      break;
      
    case 'authorizationStateWaitPassword':
      authState.awaitingCode = false;
      authState.awaitingPassword = true;
      break;
      
    case 'authorizationStateReady':
      authState.isAuthenticated = true;
      authState.awaitingCode = false;
      authState.awaitingPassword = false;
      logger.info('Cliente autenticado com sucesso');
      break;
      
    case 'authorizationStateLoggingOut':
      authState.isAuthenticated = false;
      logger.info('Fazendo logout...');
      break;
      
    case 'authorizationStateClosing':
      logger.info('Fechando conexão...');
      break;
      
    case 'authorizationStateClosed':
      authState.isAuthenticated = false;
      logger.info('Conexão fechada');
      break;
  }
}

// Função para gerar API Key
function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  logger.info(`API Key gerada: ${key}`);
  return key;
}

// Rotas de autenticação Telegram
app.post('/api/telegram/auth/phone', validateApiKey, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PHONE',
          message: 'Número de telefone não fornecido'
        }
      });
    }
    
    logger.info(`Enviando código para: ${phone}`);
    authState.phoneNumber = phone;
    
    const result = await client.invoke({
      _: 'setAuthenticationPhoneNumber',
      phone_number: phone,
      settings: {
        _: 'phoneNumberAuthenticationSettings',
        allow_flash_call: false,
        allow_missed_call: false,
        is_current_phone_number: true,
        allow_sms_retriever_api: false
      }
    });
    
    return res.json({
      success: true,
      data: {
        awaitingCode: true
      }
    });
  } catch (error) {
    logger.error(`Erro ao enviar código: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SEND_CODE_ERROR',
        message: error.message
      }
    });
  }
});

app.post('/api/telegram/auth/code', validateApiKey, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Código não fornecido'
        }
      });
    }
    
    if (!authState.awaitingCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_AWAITING_CODE',
          message: 'Não está aguardando código'
        }
      });
    }
    
    logger.info('Verificando código...');
    
    const result = await client.invoke({
      _: 'checkAuthenticationCode',
      code
    });
    
    // Nota: A resposta real virá como um evento de update
    return res.json({
      success: true,
      data: {
        awaitingPassword: authState.awaitingPassword,
        isAuthenticated: authState.isAuthenticated
      }
    });
  } catch (error) {
    logger.error(`Erro ao verificar código: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_CODE_ERROR',
        message: error.message
      }
    });
  }
});

app.post('/api/telegram/auth/password', validateApiKey, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'Senha não fornecida'
        }
      });
    }
    
    if (!authState.awaitingPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_AWAITING_PASSWORD',
          message: 'Não está aguardando senha'
        }
      });
    }
    
    logger.info('Verificando senha...');
    
    const result = await client.invoke({
      _: 'checkAuthenticationPassword',
      password
    });
    
    // Nota: A resposta real virá como um evento de update
    return res.json({
      success: true,
      data: {
        isAuthenticated: authState.isAuthenticated
      }
    });
  } catch (error) {
    logger.error(`Erro ao verificar senha: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_PASSWORD_ERROR',
        message: error.message
      }
    });
  }
});

app.get('/api/telegram/auth/status', validateApiKey, (req, res) => {
  return res.json({
    success: true,
    data: {
      isAuthenticated: authState.isAuthenticated,
      authorizationState: authState.authorizationState,
      awaitingCode: authState.awaitingCode,
      awaitingPassword: authState.awaitingPassword
    }
  });
});

// Rotas para chats
app.get('/api/chats', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    logger.info(`Obtendo lista de chats: limit=${limit}, offset=${offset}`);
    
    const result = await client.invoke({
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      limit
    });
    
    // Obter detalhes para cada chat
    const chatIds = result.chat_ids || [];
    const chats = [];
    
    for (const chatId of chatIds) {
      try {
        const chatInfo = await client.invoke({
          _: 'getChat',
          chat_id: chatId
        });
        
        chats.push(formatChatInfo(chatInfo));
      } catch (chatError) {
        logger.error(`Erro ao obter detalhes do chat ${chatId}: ${chatError.message}`);
      }
    }
    
    return res.json({
      success: true,
      data: {
        total_count: chatIds.length,
        chats
      }
    });
  } catch (error) {
    logger.error(`Erro ao obter chats: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHATS_ERROR',
        message: error.message
      }
    });
  }
});

app.get('/api/chats/:chatId', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    logger.info(`Obtendo detalhes do chat: ${chatId}`);
    
    const result = await client.invoke({
      _: 'getChat',
      chat_id: chatId
    });
    
    return res.json({
      success: true,
      data: formatChatInfo(result)
    });
  } catch (error) {
    logger.error(`Erro ao obter detalhes do chat ${req.params.chatId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHAT_ERROR',
        message: error.message
      }
    });
  }
});

app.get('/api/chats/:chatId/messages', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const limit = parseInt(req.query.limit) || 100;
    const fromMessageId = req.query.from_message_id || 0;
    
    logger.info(`Obtendo mensagens do chat ${chatId}: limit=${limit}, fromMessageId=${fromMessageId}`);
    
    const result = await client.invoke({
      _: 'getChatHistory',
      chat_id: chatId,
      limit,
      offset: 0,
      from_message_id: fromMessageId,
      only_local: false
    });
    
    const messages = result.messages.map(formatMessageInfo);
    
    return res.json({
      success: true,
      data: {
        total_count: messages.length,
        messages
      }
    });
  } catch (error) {
    logger.error(`Erro ao obter mensagens do chat ${req.params.chatId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHAT_MESSAGES_ERROR',
        message: error.message
      }
    });
  }
});

// Rota para mensagens específicas
app.get('/api/messages/:messageId', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const chatId = req.query.chat_id;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CHAT_ID',
          message: 'ID do chat não fornecido'
        }
      });
    }
    
    logger.info(`Obtendo mensagem ${messageId} do chat ${chatId}`);
    
    const result = await client.invoke({
      _: 'getMessage',
      chat_id: chatId,
      message_id: messageId
    });
    
    return res.json({
      success: true,
      data: formatMessageInfo(result)
    });
  } catch (error) {
    logger.error(`Erro ao obter mensagem ${req.params.messageId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_MESSAGE_ERROR',
        message: error.message
      }
    });
  }
});

// Rotas para arquivos
app.get('/api/files/:fileId/info', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    logger.info(`Obtendo informações do arquivo: ${fileId}`);
    
    const result = await client.invoke({
      _: 'getFile',
      file_id: fileId
    });
    
    return res.json({
      success: true,
      data: formatFileInfo(result)
    });
  } catch (error) {
    logger.error(`Erro ao obter informações do arquivo ${req.params.fileId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_FILE_INFO_ERROR',
        message: error.message
      }
    });
  }
});

app.get('/api/files/:fileId/download', validateApiKey, validateTelegramAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    logger.info(`Baixando arquivo: ${fileId}`);
    
    // Primeiro obtemos informações do arquivo
    const fileInfo = await client.invoke({
      _: 'getFile',
      file_id: fileId
    });
    
    // Verificar se o arquivo já está baixado
    if (!fileInfo.local || !fileInfo.local.is_downloading_completed) {
      // Baixar o arquivo
      logger.info(`Iniciando download do arquivo ${fileId}`);
      
      await client.invoke({
        _: 'downloadFile',
        file_id: fileId,
        priority: 1,
        offset: 0,
        limit: 0,
        synchronous: true
      });
      
      // Verificar novamente o status após o download
      const updatedFileInfo = await client.invoke({
        _: 'getFile',
        file_id: fileId
      });
      
      if (!updatedFileInfo.local || !updatedFileInfo.local.is_downloading_completed) {
        throw new Error('Falha ao baixar o arquivo');
      }
      
      fileInfo = updatedFileInfo;
    }
    
    const filePath = fileInfo.local.path;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Definir o content-type com base no mime_type do arquivo
    const mimeType = fileInfo.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    // Definir nome do arquivo para download
    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Enviar o arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`Erro ao baixar arquivo ${req.params.fileId}: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_FILE_ERROR',
        message: error.message
      }
    });
  }
});

// Rota para status
app.get('/api/status', validateApiKey, (req, res) => {
  return res.json({
    success: true,
    data: {
      version: '1.0.0',
      apiKey: API_KEY.substring(0, 5) + '...',
      isAuthenticated: authState.isAuthenticated,
      authorizationState: authState.authorizationState,
      telegramClientReady: !!client
    }
  });
});

// Funções auxiliares para formatação de dados
function formatChatInfo(chat) {
  const type = chat.type._ === 'chatTypePrivate' ? 'private' : 
               chat.type._ === 'chatTypeBasicGroup' ? 'group' :
               chat.type._ === 'chatTypeSupergroup' ? (chat.type.is_channel ? 'channel' : 'supergroup') :
               'unknown';
               
  return {
    id: chat.id,
    type,
    title: chat.title,
    photo: chat.photo ? formatPhotoInfo(chat.photo) : null,
    unread_count: chat.unread_count,
    last_message: chat.last_message ? formatMessageInfo(chat.last_message) : null,
    // Outros campos relevantes dependendo do tipo
    username: chat.type._ === 'chatTypePrivate' && chat.type.user_id ? 
             (async () => {
               try {
                 const user = await client.invoke({
                   _: 'getUser',
                   user_id: chat.type.user_id
                 });
                 return user.username;
               } catch (e) {
                 return null;
               }
             })() : null
  };
}

function formatMessageInfo(message) {
  let content = {
    type: 'unknown'
  };
  
  // Formatação do conteúdo da mensagem com base no tipo
  if (message.content) {
    switch (message.content._) {
      case 'messageText':
        content = {
          type: 'text',
          text: message.content.text.text
        };
        break;
        
      case 'messagePhoto':
        content = {
          type: 'photo',
          photo: formatFileInfo(message.content.photo.sizes[message.content.photo.sizes.length - 1].photo),
          caption: message.content.caption ? message.content.caption.text : ''
        };
        break;
        
      case 'messageVideo':
        content = {
          type: 'video',
          video: formatFileInfo(message.content.video.video),
          caption: message.content.caption ? message.content.caption.text : ''
        };
        break;
        
      case 'messageDocument':
        content = {
          type: 'document',
          document: formatFileInfo(message.content.document.document),
          caption: message.content.caption ? message.content.caption.text : ''
        };
        break;
        
      // Outros tipos...
      default:
        content = {
          type: message.content._ || 'unknown'
        };
    }
  }
  
  return {
    id: message.id,
    chat_id: message.chat_id,
    sender_id: message.sender_id ? 
      (message.sender_id._ === 'messageSenderUser' ? message.sender_id.user_id : null) :
      null,
    date: message.date,
    content,
    is_outgoing: message.is_outgoing
  };
}

function formatFileInfo(file) {
  if (!file) return null;
  
  return {
    id: file.id,
    size: file.size,
    expected_size: file.expected_size,
    local: {
      path: file.local ? file.local.path : '',
      can_be_downloaded: file.local ? file.local.can_be_downloaded : false,
      is_downloading_active: file.local ? file.local.is_downloading_active : false,
      is_downloading_completed: file.local ? file.local.is_downloading_completed : false,
      download_offset: file.local ? file.local.download_offset : 0,
      downloaded_prefix_size: file.local ? file.local.downloaded_prefix_size : 0,
      downloaded_size: file.local ? file.local.downloaded_size : 0
    },
    remote: {
      id: file.remote ? file.remote.id : '',
      is_uploading_active: file.remote ? file.remote.is_uploading_active : false,
      is_uploading_completed: file.remote ? file.remote.is_uploading_completed : false,
      uploaded_size: file.remote ? file.remote.uploaded_size : 0
    }
  };
}

function formatPhotoInfo(photo) {
  if (!photo || !photo.sizes || !photo.sizes.length) return null;
  
  // Pegar a maior versão da foto
  const largestPhoto = photo.sizes.reduce((prev, current) => 
    (prev.width * prev.height > current.width * current.height) ? prev : current
  );
  
  return formatFileInfo(largestPhoto.photo);
}

// Iniciar TDLib e servidor
async function startApp() {
  try {
    // Inicializar cliente TDLib
    logger.info('Inicializando cliente TDLib...');
    await client.connect();
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`API Key: ${API_KEY}`);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar aplicação: ${error.message}`);
    process.exit(1);
  }
}

// Lógica para finalização limpa
const cleanup = async () => {
  logger.info('Encerrando aplicação...');
  
  // Fechar o cliente TDLib se estiver conectado
  if (client) {
    try {
      await client.invoke({ _: 'close' });
    } catch (e) {
      logger.error(`Erro ao fechar cliente TDLib: ${e.message}`);
    }
  }
  
  process.exit(0);
};

// Capturar sinais para finalização limpa
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Iniciar a aplicação
startApp();
