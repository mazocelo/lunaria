import 'dotenv/config';

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
  const redisRequired = requireRedis || isTruthy(process.env.FF_AI_ASYNC_ROTEIRO);

  if (redisRequired && !process.env.REDIS_URL && !process.env.UPSTASH_REDIS_URL) {
    missing.push('REDIS_URL ou UPSTASH_REDIS_URL');
  }

  if (missing.length > 0) {
    console.error(`FATAL: Variaveis de ambiente obrigatorias nao definidas: ${missing.join(', ')}`);
    process.exit(1);
  }
}
