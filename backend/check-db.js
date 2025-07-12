import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/role_chat_game';
  
  console.log('🔍 Verificando conexão com banco de dados...');
  console.log('📡 URL:', databaseUrl);
  
  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Verificar se o banco existe
    const result = await sequelize.query('SELECT current_database()');
    console.log('📋 Banco atual:', result[0][0].current_database);
    
    // Verificar tabelas
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tabelas existentes:', tables[0].map(t => t.table_name));
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Possíveis soluções:');
      console.error('   1. Verifique se o PostgreSQL está instalado e rodando');
      console.error('   2. Para Windows: net start postgresql-x64-15');
      console.error('   3. Para Linux/Mac: sudo service postgresql start');
      console.error('   4. Crie o banco: createdb role_chat_game');
      console.error('   5. Verifique se a DATABASE_URL está correta no .env');
    }
    
    return false;
  }
}

checkDatabase(); 