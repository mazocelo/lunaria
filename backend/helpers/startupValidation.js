const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL'
];

export function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`FATAL: Variaveis de ambiente obrigatorias nao definidas: ${missing.join(', ')}`);
    process.exit(1);
  }
}
