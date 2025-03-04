
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-addon');
const logger = require('./utils/logger');
const crypto = require('crypto');

// Configuração da API
const app = express();
const PORT = process.env.PORT || 3000;

// API key para autenticação
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');
logger.info(`API Key: ${API_KEY}`);

// Middleware de segurança
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'];
  if (!providedApiKey || providedApiKey !== API_KEY) {
    return res.status(401).json({ error: 'API key inválida ou ausente' });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotas protegidas
app.use('/api', authenticateApiKey);

// Inicialização do cliente TDLib
let client = null;

const initTelegramClient = async () => {
  try {
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;

    if (!apiId || !apiHash) {
      logger.error('TELEGRAM_API_ID e TELEGRAM_API_HASH são obrigatórios');
      return;
    }

    client = new Client(new TDLib(), {
      apiId: apiId,
      apiHash: apiHash,
      databaseDirectory: './tdlib-db',
      filesDirectory: './tdlib-db',
    });

    // Endpoint raiz - status do projeto
    app.get('/', (req, res) => {
      res.json({
        name: 'Telegram Conduit API',
        version: '1.0.0',
        status: client ? 'conectado' : 'desconectado',
      });
    });

    // Iniciar o cliente
    await client.connect();
    logger.info('Cliente TDLib inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar o cliente TDLib:', error);
  }
};

// Iniciar o servidor
app.listen(PORT, () => {
  logger.info(`Servidor iniciado na porta ${PORT}`);
  initTelegramClient();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promessa rejeitada não tratada:', reason);
});
