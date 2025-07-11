import { Sequelize } from 'sequelize';

// Configuração do banco de dados
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL || 'postgresql://localhost:5432/role_chat_game';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;