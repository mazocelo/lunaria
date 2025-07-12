import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Função para configurar o banco de dados
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL || 'postgresql://localhost:5432/role_chat_game';
  
  // Verificar se é uma URL de produção (Heroku, Railway, etc.)
  const isProductionUrl = databaseUrl.includes('amazonaws.com') || 
                         databaseUrl.includes('herokuapp.com') || 
                         databaseUrl.includes('railway.app') ||
                         databaseUrl.includes('203.0.113.10') ||
                         process.env.NODE_ENV === 'production';
  // Configuração base
  const config = {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: isProductionUrl ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      // Configurações adicionais para conexões remotas
      ...(isProductionUrl && {
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000
      })
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configurações de retry para conexões instáveis
    retry: {
      max: 3,
      backoffBase: 1000
    },
    // Configurações de autenticação
    define: {
      timestamps: true,
      underscored: true
    }
  };

  // Se for uma URL local sem senha, usar configuração específica
  if (!isProductionUrl && databaseUrl.includes('localhost')) {
    return new Sequelize(databaseUrl, config);
  }

  // Para URLs de produção ou com senha, usar configuração padrão
  return new Sequelize(databaseUrl, config);
}

const sequelize = getDatabaseConfig();

export default sequelize;