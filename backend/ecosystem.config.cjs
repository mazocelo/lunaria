module.exports = {
  apps: [
    {
      name: 'lunaria-backend',
      script: './bin/www',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      kill_timeout: 10000,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'lunaria-worker',
      script: './bin/worker',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      kill_timeout: 15000,
      env: { NODE_ENV: 'production' },
    },
  ],
};
