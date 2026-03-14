import { createClient } from 'redis';
import dotenv from 'dotenv';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'redis-config' });

dotenv.config();

// Configuracao do cliente Redis com timeout e retry
const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        log.error('Redis: max reconnect attempts reached');
        return new Error('Redis max retries exceeded');
      }
      // Exponential backoff: 100ms, 200ms, 400ms... max 5s
      return Math.min(100 * Math.pow(2, retries), 5000);
    }
  }
});

// Event listeners para conexao
redisClient.on('error', (err) => {
  log.error({ err }, 'Erro na conexao com Redis');
});

redisClient.on('connect', () => {
  log.info('Conectado ao Redis com sucesso');
});

redisClient.on('ready', () => {
  log.info('Redis esta pronto para uso');
});

redisClient.on('end', () => {
  log.info('Conexao com Redis encerrada');
});

// Funcao para inicializar a conexao
async function inicializarRedis() {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    log.error({ err: error }, 'Falha ao conectar com Redis');
    throw error;
  }
}

// Funcao para fechar a conexao
async function fecharConexaoRedis() {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      log.info('Conexao com Redis fechada adequadamente');
    }
  } catch (error) {
    log.error({ err: error }, 'Erro ao fechar conexao com Redis');
  }
}

// Signal handlers are centralized in bin/www (graceful shutdown)
// Removed process.exit handlers from here to avoid multiple competing handlers

export { redisClient, inicializarRedis, fecharConexaoRedis };
