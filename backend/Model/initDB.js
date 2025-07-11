import db from './index.js';

// Função para inicializar o banco de dados
const initDatabase = async () => {
    try {
        // Sincronizar todos os modelos com o banco
        await db.sequelize.sync({ force: false });
        console.log('✅ Banco de dados sincronizado com sucesso!');
        
        // Verificar conexão
        await db.sequelize.authenticate();
        console.log('✅ Conexão com banco de dados estabelecida!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        throw error;
    }
};

export default initDatabase; 