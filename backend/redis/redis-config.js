import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Event listeners para conexão
redisClient.on('error', (err) => {
  console.error('❌ Erro na conexão com Redis:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Conectado ao Redis com sucesso');
});

redisClient.on('ready', () => {
  console.log('🚀 Redis está pronto para uso');
});

redisClient.on('end', () => {
  console.log('🔌 Conexão com Redis encerrada');
});

// Função para inicializar a conexão
async function inicializarRedis() {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Falha ao conectar com Redis:', error);
    throw error;
  }
}

// Função para fechar a conexão
async function fecharConexaoRedis() {
  try {
    await redisClient.quit();
    console.log('🔌 Conexão com Redis fechada adequadamente');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão com Redis:', error);
  }
}

// Tratamento de sinais para fechar conexão adequadamente
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT, fechando conexão Redis...');
  await fecharConexaoRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM, fechando conexão Redis...');
  await fecharConexaoRedis();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', async (error) => {
  console.error('❌ Erro não capturado:', error);
  await fecharConexaoRedis();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  await fecharConexaoRedis();
  process.exit(1);
});

export { redisClient, inicializarRedis, fecharConexaoRedis }; 