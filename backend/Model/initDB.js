import sequelize from './configDB.js';
import db from './index.js';

/**
 * Inicializar banco de dados
 */
async function initDatabase() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    
    // Sincronizar modelos
    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com sucesso');

    // Verificar se as tabelas foram criadas
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('📋 Tabelas disponíveis:', tables.flat());
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    
    // Tratamento específico para erros de conexão
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Dicas para resolver o problema:');
      console.error('   1. Verifique se o PostgreSQL está rodando');
      console.error('   2. Verifique se a DATABASE_URL está correta no .env');
      console.error('   3. Para desenvolvimento local, use: postgresql://localhost:5432/role_chat_game');
      console.error('   4. Para produção, verifique se a URL contém usuário e senha');
    }
    
    // Não interromper a aplicação, apenas logar o erro
    console.error('⚠️  Aplicação continuará sem banco de dados');
    return false;
  }
} 

export default initDatabase; 