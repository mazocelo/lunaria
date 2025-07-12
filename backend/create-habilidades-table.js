import sequelize from './Model/configDB.js';
import db from './Model/index.js';

/**
 * Script para criar a tabela de habilidades
 */
async function createHabilidadesTable() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    
    // Forçar criação da tabela habilidades
    console.log('🔄 Criando tabela habilidades...');
    await db.Habilidade.sync({ force: true });
    console.log('✅ Tabela habilidades criada com sucesso');

    // Verificar se a tabela foi criada
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'habilidades\'');
    console.log('📋 Tabela habilidades existe:', tables[0].length > 0);
    
    // Verificar estrutura da tabela
    const columns = await sequelize.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\' AND table_name = \'habilidades\' ORDER BY ordinal_position');
    console.log('📋 Colunas da tabela habilidades:');
    columns[0].forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela habilidades:', error);
    process.exit(1);
  }
}

createHabilidadesTable(); 