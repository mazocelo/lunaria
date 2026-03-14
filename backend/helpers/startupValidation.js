import 'dotenv/config';
import logger from './logger.js';
const log = logger.child({ module: 'startupValidation' });

const BASE_REQUIRED_ENV_VARS = ['DATABASE_URL'];
const AUTH_REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

function isTruthy(value) {
  return value === 'true' || value === '1';
}

export function validateEnvironment(options = {}) {
  const {
    requireRedis = false,
    requireAuthSecrets = true
  } = options;

  const required = [
    ...BASE_REQUIRED_ENV_VARS,
    ...(requireAuthSecrets ? AUTH_REQUIRED_ENV_VARS : [])
  ];

  const missing = required.filter(v => !process.env[v]);
  const redisRequired = true;

  if (redisRequired && !process.env.REDIS_URL && !process.env.UPSTASH_REDIS_URL) {
    missing.push('REDIS_URL ou UPSTASH_REDIS_URL');
  }

  if (missing.length > 0) {
    log.error({ missing }, 'FATAL: Variaveis de ambiente obrigatorias nao definidas');
    process.exit(1);
  }
}
